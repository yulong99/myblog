Go to this [site](https://mano.is.tue.mpg.de/login.php)
Download the zip folder from "Models & Code" and extract it to get the folder mano_v1_2
Download the zip folder from "Extended SMPL+H model" and extract it to get the folder smplh
$ git clone https://github.com/vchoutas/smplx.git
$ cd smplx
$ python tools/merge_smplh_mano.py \
--smplh-fn /path/to/smplh/neutral/model.npz \
--mano-left-fn /path/to/mano_v1_2/models/MANO_LEFT.pkl \
--mano-right-fn /path/to/mano_v1_2/models/MANO_RIGHT.pkl \
--output-folder /path/to/smplh/merged
This will produce "model.pkl" in the "/path/to/smplh/merged". You can rename it to SMPLH_NEUTRAL.pkl and place it under the smpl_models/smplh/SMPLH_NEUTRAL.pkl!

![image-20251127102232509](C:/Users/wyl/AppData/Roaming/Typora/typora-user-images/image-20251127102232509.png)

![image-20251127102248810](C:/Users/wyl/AppData/Roaming/Typora/typora-user-images/image-20251127102248810.png)