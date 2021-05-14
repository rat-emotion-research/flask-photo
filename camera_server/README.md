# Photo Server
This code should be run on devices with cameras attached to them.

## Install
Although python dependencies are managed through pipenv, OpenCV may require some additional packages. 

If you get missing library errors, you can find how to install the build dependencies here (linux/deb)
https://docs.opencv.org/4.5.2/d2/de6/tutorial_py_setup_in_ubuntu.html

In order to install the python dependencies, make sure pipenv is installed `pip install pipenv` then run:
```
pipenv install
```

## Run
```
pipenv run flask run
```

Go to `<server-ipaddress>:8080` to see a "hello world" message. Take/display a photo by going to `<server-ipaddress>:8080/take-photo`
