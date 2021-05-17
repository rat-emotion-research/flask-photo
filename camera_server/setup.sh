sudo apt update
sudo apt install -y git python3-pip

# installs the dependencies
sudo apt install -y python3-opencv
sudo apt-get install -y libatlas-base-dev
echo "bcm2835-v4l2" | sudo tee -a /etc/modules
pip3 install -U opencv-python flask flask-cors python-dotenv 

