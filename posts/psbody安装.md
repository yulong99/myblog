1、git clone https://github.com/MPI-IS/mesh.git

2、cd mesh/

3、修改requirements.txt

# 锁定setuptools为59.5.0，完全兼容lvd-templ和旧版pytorch-lightning，禁止自动升级
setuptools==59.5.0
numpy>=1.24.4
matplotlib>=3.7.5
scipy>=1.10.1
# 锁定PyOpenGL为3.1.0，完全兼容pyrender 0.1.45，禁止自动升级
PyOpenGL==3.1.0
pillow>=10.4.0
pyzmq>=27.1.0
pyyaml>=6.0.3
opencv-python>=4.12.0.88
# 可选：若需要锁定pytorch-lightning，也添加该行
pytorch-lightning==1.5.10

4、python -m pip install pip==20.2.4

5、make all

