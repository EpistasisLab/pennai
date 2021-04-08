FROM ubuntu:bionic

RUN apt-get update && apt-get install -y wget xz-utils curl

#nodejs
RUN wget --quiet https://nodejs.org/dist/v11.14.0/node-v11.14.0-linux-arm64.tar.xz -O ~/node.tar.xz && \
    tar -xvf ~/node.tar.xz -C /opt/ && \
    rm ~/node.tar.xz
ENV PATH /opt/node-v11.14.0-linux-arm64/bin:$PATH

RUN apt-get update --fix-missing \
    && apt-get install -y --no-install-recommends \
    graphviz dos2unix python3-numpy libatlas-base-dev gfortran libgfortran5 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Ensure specific python version
# See: https://stackoverflow.com/a/58562728/1730417
# and: https://askubuntu.com/a/1176271/260220
RUN apt-get update && apt-get install -y software-properties-common
RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt-get update
RUN apt-get install -y python3.7 python3.7-dev python3.7-distutils
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.7 1
RUN update-alternatives --set python /usr/bin/python3.7
RUN curl -s https://bootstrap.pypa.io/get-pip.py -o get-pip.py && \
    python get-pip.py --force-reinstall && \
        rm get-pip.py
        
RUN npm install -g mocha

RUN pip install --upgrade pip

## tests
COPY /tests/unit/requirements-rpi.txt /root/test_requirements.txt
RUN pip install --no-cache-dir -r /root/test_requirements.txt

## machine and lab container
RUN mkdir /root/wheel
COPY /docker/pennai-arm64-deps/lab/wheel/*.whl /root/wheel/ 
COPY /docker/pennai-arm64-deps/machine/wheel/*.whl /root/wheel/ 
COPY /docker/lab/files/requirements-raspberrypi.txt /root/lab_requirements.txt
RUN pip3 install --no-index --find-links=/root/wheel -r /root/lab_requirements.txt

COPY /docker/machine/files/requirements-raspberrypi.txt /root/mach_requirements.txt
RUN pip install --no-index --find-links=/root/wheel -r /root/mach_requirements.txt

### Bill's surprise fork
#RUN pip install --verbose --verbose --verbose --no-cache-dir git+https://github.com/lacava/surprise.git@1.0.8.3
RUN pip install --no-index --find-links=/root/wheel scikit_surprise


# install lab/node_modules to an anon volume
WORKDIR /appsrc/lab
COPY lab/package.json /appsrc/lab/
RUN dos2unix /appsrc/lab/package.json
RUN npm install --silent --progress=false

# install lab/webapp/node_modules to an anon volume
WORKDIR /appsrc/lab/webapp
COPY lab/webapp/package.json /appsrc/lab/webapp/
RUN dos2unix /appsrc/lab/webapp/package.json
RUN npm install --silent --progress=false
