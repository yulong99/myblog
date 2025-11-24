# DashGaussian 项目与论文详细概述文档  

## 1. 背景与要解决的问题  

- **3DGS 优势与瓶颈**  
  - 3D Gaussian Splatting (3DGS) 用高斯原语直接表示场景，能在保持 NeRF 级别画质的前提下，把单场景优化时间从数十小时降到十几分钟。  
  - 但对很多应用来说，这仍然偏慢：  
    - 消费级 GPU 上训练一场景需要十几分钟。  
    - 大规模城市、多场景批量重建时，总时间仍然巨大。  

- **时间主要花在哪里？**  
  论文指出 3DGS 一次迭代中最耗时的是三类操作：  
  - **前向渲染**：按当前高斯集合在给定分辨率上渲染所有像素。  
  - **反向传播**：对所有像素和所有高斯求梯度。  
  - **原语更新/稠密化**：根据 densification 策略克隆/分裂/剪枝高斯。  

  这三者的复杂度几乎都只由两件事决定：  
  - **渲染分辨率**（像素个数）。  
  - **高斯原语数量**（参与每个像素累积的 primitive 数）。  

  论文把这两者合称为 **“优化复杂度”**（optimization complexity）。

- **已有加速方法的问题**  
  - 工程向：改写 CUDA / backward pipeline（如 3dgs-accel、Taming-3DGS 等），提升每次前向/反向的速度。  
  - 算法向：在 densification 后剪枝冗余高斯（如 Reduced-3DGS、Mini-Splatting），或减少每个高斯的特征维度。  
  - 这些方法在大幅压缩参数时，**画质容易明显下降**，或者改动 pipeline 较大，泛化性有限。  

**DashGaussian 想解决的问题：**  
> 在不牺牲（甚至略微提升）渲染质量的前提下，通过**更聪明地分配计算资源**，显著缩短 3DGS 优化时间，并且作为一个 **可插拔插件** 适用于多种 3DGS backbone。  

---

## 2. 核心思想与主要贡献  

- **核心思想（一句话）：**  
  把 3DGS 优化看成“逐步拟合训练视图中越来越高频成分”的过程，通过 **频域引导的分辨率调度** + **分辨率引导的 primitive 数量调度**，在不同阶段动态控制优化复杂度，从而在几乎不降画质的情况下，大幅加速训练。

- **三个关键模块**  
  - **频率引导的分辨率调度（Resolution Scheduler）**  
    - 通过对训练图像做 DFT，分析各个分辨率下的频率能量，决定：  
      - 早期在低分辨率上训练（拟合低频内容），  
      - 逐步切换到高分辨率（拟合高频细节）。  
  - **分辨率引导的 primitive 调度（Primitive Scheduler）**  
    - 把目标高斯数量设成随迭代数和分辨率变化的凹向上曲线：  
      - 早期避免 primitive 暴涨（否则低分辨率下会浪费计算）。  
      - 中后期再加速 densification，最后达到接近 backbone 最终密度。  
  - **动量式 primitive 预算（Momentum-based Primitive Budgeting）**  
    - 不用手动指定最终 primitive 上限，而是在训练中根据每次自然 densification 的数量，用类似动量更新的公式估计所需的最大 primitive 数 P_fin。  

- **实验结论概括**  
  - 作为独立快优化方法：  
    - 在 Taming-3DGS backbone 上，DashGaussian 可以把单场景优化时间压到 **约 200 秒**，同时画质略好于其他快速 3DGS 方法。  
  - 作为插件：  
    - 在 3DGS、Mip-Splatting、Revising-3DGS、Taming-3DGS 等多种 backbone 上，**平均加速约 45.7%**，  
    - 同时 primitive 数更少或相当，PSNR/SSIM/LPIPS 基本不降，甚至略有提升。  

---

## 3. 算法 / “网络结构”整体框架  

DashGaussian **不是**一个新的神经网络结构，而是对已有 3DGS 优化过程的 **调度框架**。可以把整体流程理解为下图（文字版）：

- **输入模块**  
  - 多视图 RGB 图像 `{I_n}`，带相机内外参（COLMAP/SfM 得到）。  
  - 场景点云（用于初始化高斯原语，和原版 3DGS 一致）。  

- **3DGS Backbone（原始网络/模型）**  
  - 一组 3D 高斯 `{G_i}`（位置、协方差、opacity、颜色参数等）。  
  - 可微分的 splatting 渲染核（diff-gaussian-rasterization）。  
  - 损失函数（L2 + 可能的正则项）。  
  - densification 逻辑（根据梯度/误差分裂/克隆高斯）。  

- **DashGaussian 调度层（新贡献）**  

  1. **频率分析与分辨率曲线生成**（离线预处理 + 全局调度）  
     - 对训练图像在不同下采样尺度 r 计算频率能量 X(F_r)。  
     - 根据能量比例，决定：  
       - 每个分辨率区间应占的迭代步数。  
       - 实际训练时第 k 步采用的渲染分辨率 r(k)。  
     - 补充细节：  
       - 使用防混叠的下采样（PyTorch 官方 anti-alias 算法）避免 2D aliasing。  
       - 通过对 log 比例的函数（补充材料中的 Eq.(6)(7)）压缩低分辨率阶段、延长高分辨率阶段。  

  2. **分辨率引导的 primitive 数量曲线**  
     - 记 P_init 为初始 primitive 数，P_fin 为目标上限。  
     - 定义目标 primitive 数 Pi ≈ P_init + (P_fin - P_init) · f(r(i), i/S)，  
       使得：  
       - 早期（低分辨率）增长受限，防止过密。  
       - 中后期增速加快，但最终 primitive 总面积（∑Pi）整体较小。  
     - 保持整条曲线 **凹向上**，与以往 concave-down 或前半段暴涨的 densification 策略形成对比。  

  3. **动量式 P_fin 估计**  
     - 每次 densification 后，统计“本次自然 densify 的 primitive 数量” P_add(i)。  
     - 按  
       \[
       P_{fin}^{(i)} = \max\left(P_{fin}^{(i-1)},\ \gamma P_{fin}^{(i-1)} + \eta P_{add}^{(i)}\right)
       \]  
       更新目标上限（γ≈0.98，η≈1）。  
     - 实际最终 primitive 数 N_GS ≤ P_fin，因 densification 同时受阈值和 top-k 控制。  

- **训练迭代流程（单步）**  

  每个迭代 i：  
  - **步骤 1**：用分辨率调度器确定当前分辨率 r(i)，下采样 ground-truth 图像到对应大小。  
  - **步骤 2**：在该分辨率下用当前高斯集合渲染，计算与下采样 GT 的损失。  
  - **步骤 3**：反向传播更新所有高斯参数（位置、协方差、颜色、opacity 等）。  
  - **步骤 4**：根据 primitive 调度器与 backbone 自身的 densification 分数，选择 top-k 原语进行 prune / clone / split，使实际数量尽量接近 Pi。  

- **输出**  
  - 优化好的 3D 高斯集合（可导出为 `.ply` 等），在全分辨率下渲染 novel views。  
  - 同时得到一条分辨率曲线和一条 primitive 数曲线（仅用于分析/可视化）。  

---

## 4. 输入、输出与可微性  

- **输入**  
  - 与标准 3DGS 相同：  
    - 多视图 RGB 图像（一般是 COLMAP 预处理后的数据组织形式）。  
    - 每张图像的相机内外参。  
    - 初始点云（SfM/Colmap 生成）。  
  - DashGaussian 额外需要：  
    - 训练图像在频域的能量分布（训练开始前可一次性计算）。  
    - 调度相关超参数：  
      - 总迭代数 S，  
      - 初始分辨率控制参数 a（决定最小 r_max），  
      - 动量参数 γ、η（决定 P_fin 估计）。  

- **输出**  
  - 与 backbone 一致：  
    - 场景的 3D 高斯集合：  
      - 位置 `p_i`、协方差 `Σ_i`、opacity `o_i`、颜色系数 `c_i`（如 SH 系数）。  
    - 用这些高斯可以在任意视角渲染 RGB 图像。  
  - 实验中统计的指标：  
    - PSNR、SSIM、LPIPS、训练时间（分钟）、最终 primitive 数（N_GS）。  

- **是否可微？**  
  - 渲染和参数更新部分完全沿用 3DGS 的 **可微分 rasterization**，DashGaussian 只改变：  
    - 用哪一分辨率渲染（选择不同大小的像素格子）；  
    - 在 densification 时克隆/剪枝哪些高斯（和原 3DGS 一样，本来就是非连续操作）。  
  - 因此，它保持与 3DGS 相同的 **端到端可微优化特性**，可以继续用梯度下降进行训练/微调。  

---

## 5. 训练与微调：如何使用 DashGaussian  

### 5.1 项目层面的使用方式  

- **环境准备**（见项目 README）  
  - Clone 仓库：  
    - `git clone https://github.com/YouyuChen0207/DashGaussian.git`  
  - 按原始 3DGS 仓库的说明安装依赖（本仓库已将 `diff-gaussian-rasterization` 切到 `3dgs-accel` 分支以加速 backward）。  

- **运行脚本**  
  - 设置 `scripts/full_eval.sh` 中的数据路径（指向你的 Mip-NeRF360/Deep Blending/T&T 数据路径）。  
  - 执行：  
    - `bash scripts/full_eval.sh`  

- **关键命令行选项（在 `full_eval.py` 中）**  
  - `--dash`：启用 DashGaussian 调度（核心开关）。  
  - `--fast`：使用 Sparse Adam 优化器（类似 Taming-3DGS 风格的“工程加速”）。  
  - `--preset_upperbound`：手动设置 primitive 数上限，**关闭动量式 primitive 预算**（默认不启用）。  

### 5.2 是否可以“微调训练”？  

这里的“微调”可以理解为两类：  

- **(1) 在新场景上训练时，微调 DashGaussian 的调度超参数**  
  - 例如：  
    - 场景纹理很简单，可把 a 设得更大，让初始分辨率更低、低分辨率阶段更长，从而进一步加速。  
    - 对画质非常敏感，可适度增大 γ，让 P_fin 更大、primitive 更密集。  

- **(2) 在已有 3DGS 模型基础上继续优化（继续训练）**  
  - 思路：  
    - 使用原 3DGS/Taming-3DGS 的 checkpoint 作为初始化。  
    - 启用 `--dash`，在较短的额外迭代中继续优化：  
      - 早期可以从中等分辨率开始，避免过度下采样；  
      - 也可以把总迭代数 S 设置得更小，让调度在“后半程”完成。  
  - 优点：  
    - 在已有结果上进行“收尾抛光”，利用频域分辨率调度更好拟合高频细节。  
    - 可在已有 primitive 分布基础上，用 DashGaussian 的 primitive 调度重新整理密度配置。  

### 5.3 典型训练 / 微调流程示例（概念层面）  

- **新场景完整训练**  
  - **步骤 1**：按原 3DGS 流程准备数据（COLMAP、poses、sparse point cloud）。  
  - **步骤 2**：在 DashGaussian 仓库中配置好路径，执行训练脚本并加上 `--dash`。  
  - **步骤 3**：可选：  
    - 使用 `--fast` 叠加 Sparse Adam 加速，  
    - 使用默认 γ=0.98，a=4，一般能在保证质量的前提下获得较大加速。  

- **已有 checkpoint 微调**  
  - **步骤 1**：在 backbone 代码中加载原 3DGS 或 Taming-3DGS 的 checkpoint。  
  - **步骤 2**：启用 DashGaussian：  
    - 开启 `--dash`，将总迭代数设置为较小值（如原训练步数的一小部分）。  
    - 适当提高初始分辨率（减小 a 或直接限定 r(i) 的最小值），避免过多时间浪费在已收敛的低频部分。  
  - **步骤 3**：根据需要选择是否允许继续 densification：  
    - 需要更细节 ⇒ 启用 primitive 调度、保留 P_fin 更新。  
    - 只想微调颜色 ⇒ 可以大幅减小 primitive 增长或固定 P_fin。  

---

## 6. 论文实验与数据集概览  

### 6.1 使用的数据集  

- **Mip-NeRF 360**  
  - 实际拍摄的“无界”场景数据集，含 bicycle, garden, stump, flowers, treehill, room, kitchen, counter, bonsai 等场景。  
  - 主要用于评估室内外复杂几何与光照下的 novel view synthesis。  

- **Deep Blending Dataset**  
  - 由 Deep Blending 提供的场景，如 drjohnson、playroom。  
  - 场景纹理和几何复杂度高，适合评估视角插值质量和融合能力。  

- **Tanks & Temples (T&T)**  
  - train、truck 等大场景。  
  - 经典大规模重建基准，用于评估算法在复杂室外结构上的性能。  

- **MatrixCity（大规模实验）**  
  - 大规模城市级神经渲染数据集。  
  - 论文中跟随 VastGaussian 的划分策略，把城市切成 9 个 block 分别训练，用 Taming-3DGS 作为 backbone，检验 DashGaussian 在城市级重建中的扩展性。  

### 6.2 对比方法与 backbones  

- **快速 3DGS 优化方法对比**（表 1）  
  - 3DGS（原始版本）。  
  - Reduced-3DGS：通过裁剪高斯减少内存与算力。  
  - Mini-Splatting：限制高斯总数。  
  - Taming-3DGS：通过更高效 backward 和 Sparse Adam 加速。  
  - DashGaussian + Taming-3DGS（本文方法）。  

- **作为插件增强不同 backbone 的对比**（表 2）  
  - 3DGS + DashGaussian。  
  - Mip-Splatting + DashGaussian（alias-free 3DGS）。  
  - Revising-3DGS* + DashGaussian（作者基于 Taming-3DGS 重实现）。  
  - Taming-3DGS + DashGaussian。  

### 6.3 评价指标  

- **渲染质量**  
  - PSNR（越高越好）。  
  - SSIM（结构相似性，越高越好）。  
  - LPIPS（感知距离，越低越好）。  

- **效率与模型规模**  
  - 平均优化时间（分钟）。  
  - 最终高斯数量 N_GS（越少越好，在质量相近的前提下）。  

### 6.4 关键实验结论  

- **与其它快速 3DGS 方法比较（表 1）**  
  - 在 Mip-NeRF 360 / Deep Blending / T&T 三个数据集上：  
    - DashGaussian（搭配 Taming-3DGS）能在 **~200 秒内完成训练**，  
    - 相比 Reduced-3DGS / Mini-Splatting 有明显更好或相当的 PSNR/SSIM，  
    - 相比 Taming-3DGS 本身，时间进一步大幅降低，画质略有提升。  

- **作为插件增强各 backbone（表 2）**  
  - 在所有 backbone 上：  
    - **时间减少约 45.7%（平均）**。  
    - primitive 数略减或持平（说明调度有效减少计算冗余）。  
    - PSNR/SSIM 基本持平甚至稍高，LPIPS 大多不变或略优。  

- **时间剖析（图 5）**  
  - 对 3DGS 与 Taming-3DGS 分别统计：  
    - 单步 forward、backward、optimize 的时间。  
  - DashGaussian 在三项上都有显著下降，说明通过控制分辨率与 primitive 数，确实减少了每步的实算量。  

- **消融实验（表 3，表 8，表 9）**  
  - 单独使用分辨率调度或 primitive 调度都可以在加速的同时轻微提升画质。  
  - 同时使用两者（Full），效果最好：  
    - 时间减少最多（例如 Taming-3DGS 上约 41.3%），  
    - primitive 数变少，PSNR 仍高于 backbone。  
  - 超参数 γ、a 的变化基本遵循直观：  
    - γ 越大 ⇒ P_fin 越大 ⇒ primitive 更多 ⇒ 画质略好，时间略长。  
    - a 越大 ⇒ 初始分辨率越低 ⇒ 时间更短，画质变化不大。  

- **大规模 MatrixCity 实验（表 10）**  
  - 在城市级场景上：  
    - DashGaussian 将 Taming-3DGS 的训练时间从 44.22 min 降到 25.82 min（约 41.6% 加速），  
    - PSNR/SSIM/LPIPS 略有改善，primitive 数几乎不变。  

---

## 7. 总结与适用场景  

- **DashGaussian 解决的核心问题**  
  - 在 3DGS 训练中，如何**不牺牲画质**、甚至略有提升的前提下，大幅减少训练时间。  

- **方法本质**  
  - 把 3DGS 优化视为逐步拟合图像频率成分的过程，  
  - 通过频率分析来调度渲染分辨率，  
  - 再用分辨率引导 primitive 的密度增长，  
  - 并用动量策略自适应地估计合适的 primitive 上限。  

- **工程特点**  
  - 不改变 3DGS 的基本表示与渲染核，仅在“训练调度层”做工作。  
  - 作为插件易于嵌入：在不同 backbone 上仅需改动分辨率、densification 与学习率 schedule。  
  - 完全保持可微性，可继续做场景级训练与微调。  

- **适合的应用场景**  
  - 需要大量场景批量重建（如多房间/多建筑）。  
  - 目标设备算力有限（如消费级 GPU），但仍希望保持 3DGS 级别画质。  
  - 现有 3DGS pipeline 已跑通，希望“白嫖”进一步加速而不大改工程结构。  
