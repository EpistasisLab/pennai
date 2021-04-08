FROM ubuntu:bionic

#RUN apt-get update --fix-missing && apt-get install -y wget

#nodejs
#RUN wget --quiet https://nodejs.org/dist/v11.14.0/node-v11.14.0-linux-x64.tar.xz -O ~/node.tar.xz && \
#    tar -xvf ~/node.tar.xz -C /opt/ && \
#    rm ~/node.tar.xz
#ENV PATH /opt/node-v11.14.0-linux-x64/bin:$PATH

RUN groupadd --gid 1000 node \
  && useradd --uid 1000 --gid node --shell /bin/bash --create-home node

ENV NODE_VERSION 12.20.0

RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
    && case "${dpkgArch##*-}" in \
      amd64) ARCH='x64';; \
      ppc64el) ARCH='ppc64le';; \
      s390x) ARCH='s390x';; \
      arm64) ARCH='arm64';; \
      armhf) ARCH='armv7l';; \
      i386) ARCH='x86';; \
      *) echo "unsupported architecture"; exit 1 ;; \
    esac \
    && set -ex \
    # libatomic1 for arm
    && apt-get update && apt-get install -y ca-certificates curl wget gnupg dirmngr xz-utils libatomic1 --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && for key in \
      4ED778F539E3634C779C87C6D7062848A1AB005C \
      94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
      1C050899334244A8AF75E53792EF661D867B9DFA \
      71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
      8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
      C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
      C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C \
      DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
      A48C2BEE680E841632CD4E44F07496B3EB3C1762 \
      108F52B48DB57BB0CC439B2997B01419BD92F80A \
      B9E2F5981AA6E0CD28160D9FF13993A75599653C \
    ; do \
      gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" || \
      gpg --batch --keyserver hkp://ipv4.pool.sks-keyservers.net --recv-keys "$key" || \
      gpg --batch --keyserver hkp://pgp.mit.edu:80 --recv-keys "$key" ; \
    done \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
    && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
    && grep " node-v$NODE_VERSION-linux-$ARCH.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
    && tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
    && rm "node-v$NODE_VERSION-linux-$ARCH.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
    && apt-mark auto '.*' > /dev/null \
    && find /usr/local -type f -executable -exec ldd '{}' ';' \
      | awk '/=>/ { print $(NF-1) }' \
      | sort -u \
      | xargs -r dpkg-query --search \
      | cut -d: -f1 \
      | sort -u \
      | xargs -r apt-mark manual \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
    # smoke tests
    && node --version \
    && npm --version

ENV YARN_VERSION 1.22.5

RUN set -ex \
  && savedAptMark="$(apt-mark showmanual)" \
  && apt-get update && apt-get install -y ca-certificates curl wget gnupg dirmngr --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* \
  && for key in \
    6A010C5166006599AA17F08146C2130DFD2497F5 \
  ; do \
    gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" || \
    gpg --batch --keyserver hkp://ipv4.pool.sks-keyservers.net --recv-keys "$key" || \
    gpg --batch --keyserver hkp://pgp.mit.edu:80 --recv-keys "$key" ; \
  done \
  && curl -fsSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \
  && curl -fsSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz.asc" \
  && gpg --batch --verify yarn-v$YARN_VERSION.tar.gz.asc yarn-v$YARN_VERSION.tar.gz \
  && mkdir -p /opt \
  && tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \
  && ln -s /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \
  && ln -s /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \
  && rm yarn-v$YARN_VERSION.tar.gz.asc yarn-v$YARN_VERSION.tar.gz \
  && apt-mark auto '.*' > /dev/null \
  && { [ -z "$savedAptMark" ] || apt-mark manual $savedAptMark > /dev/null; } \
  && find /usr/local -type f -executable -exec ldd '{}' ';' \
    | awk '/=>/ { print $(NF-1) }' \
    | sort -u \
    | xargs -r dpkg-query --search \
    | cut -d: -f1 \
    | sort -u \
    | xargs -r apt-mark manual \
  && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
  # smoke test
  && yarn --version

ARG docker_filepath=docker/lab/files
ARG python_wheel_directory=docker/pennai-arm64-deps/lab/wheel

RUN apt-get update --fix-missing && apt-get install -y \
    openssh-client openssh-server telnet apache2 \
    net-tools iputils-ping xz-utils \
    ngrep ca-cacert \
    build-essential cmake lsb-core cpio mesa-common-dev \
    dos2unix curl git libatlas-base-dev gfortran \
    --no-install-recommends && \
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

# ensure local python is preferred over distribution python
ENV PATH /usr/local/bin:$PATH

# http://bugs.python.org/issue19846
# > At the moment, setting "LANG=C" on a Linux system *fundamentally breaks Python 3*, and that's not OK.
ENV LANG C.UTF-8

ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
ARG DEBIAN_FRONTEND=noninteractive
RUN  apt-get update && apt-get install -y --no-install-recommends \
		libbluetooth-dev \
		tk-dev \
		uuid-dev \
	&& rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y --no-install-recommends \
  wget python3.7-venv python3-numpy \
  && apt-get clean \
  && rm -rf /var/lib/apt/list/*

RUN python3 --version
RUN python --version
RUN python -m venv /venv
ENV PATH=/venv/bin:$PATH
RUN python --version
RUN pip --version

# setup python environment
COPY ${docker_filepath}/requirements-raspberrypi.txt /root/
RUN mkdir /root/wheel
COPY ${python_wheel_directory}/*.whl /root/wheel/
RUN pip3 install --no-cache-dir cython
RUN pip3 install --no-index --find-links=/root/wheel -r /root/requirements-raspberrypi.txt
### bill's surprise fork
# NOTE: For some reason, this install doesn't seem to recognize the installed numpy
#       when run on Docker. As a workaround, the `wheel` directory includes a wheel
#       for this install.
#RUN pip3 install --no-cache-dir git+https://github.com/lacava/surprise.git@1.0.8.3
RUN pip3 install --no-index --find-links=/root/wheel scikit_surprise

## Webserver

RUN rm /etc/apache2/sites-enabled/*
COPY ${docker_filepath}/ports.conf /etc/apache2/
RUN cp  /etc/apache2/mods-available/rewrite* /etc/apache2/mods-enabled \
	&& cp /etc/apache2/mods-available/ssl* /etc/apache2/mods-enabled \
	&& cp /etc/apache2/mods-available/socache* /etc/apache2/mods-enabled \
	&& cp /etc/apache2/mods-available/proxy.* /etc/apache2/mods-enabled \
	&& cp /etc/apache2/mods-available/proxy_wstunnel.load /etc/apache2/mods-enabled \
	&& cp /etc/apache2/mods-available/proxy_http.load /etc/apache2/mods-enabled \
	&& cp /etc/apache2/mods-available/headers.load /etc/apache2/mods-enabled \
	&& cp /etc/apache2/mods-available/expires.load /etc/apache2/mods-enabled

# setup node environment
RUN npm install -g pm2 webpack --silent --progress=false

# install lab/webapp/node_modules to an anon volume
WORKDIR /appsrc/lab/webapp
COPY lab/webapp/package.json /appsrc/lab/webapp/
COPY lab/webapp/package-lock.json /appsrc/lab/webapp/
RUN dos2unix /appsrc/lab/webapp/*.json
RUN npm install --silent --progress=false

# install lab/node_modules to an anon volume
WORKDIR /appsrc/lab
COPY lab/package.json /appsrc/lab/
COPY lab/package-lock.json /appsrc/lab/
RUN dos2unix /appsrc/lab/*.json
RUN npm install --silent --progress=false

RUN apt-get install -y libgfortran5 liblapack-dev

COPY ${docker_filepath}/001-pennai.conf /etc/apache2/sites-enabled/
COPY ${docker_filepath}/htpasswd /etc/apache2/htpasswd
COPY ${docker_filepath}/certs/* /usr/lib/ssl/private/

WORKDIR /root/

# Webserver - paiwww
COPY ${docker_filepath}/start.sh /root/

## Utility script, used when starting ai
COPY ${docker_filepath}/wait-for-it.sh /root/
RUN ["chmod", "+x", "/root/wait-for-it.sh"]


## PennAI Lab server
COPY ${docker_filepath}/entrypoint.sh /root/
RUN ["chmod", "+x", "/root/entrypoint.sh"]

RUN dos2unix /root/start.sh \
	&& dos2unix /root/wait-for-it.sh \
	&& dos2unix /root/entrypoint.sh

# set version and build environment; tag.sh is sourced in entrypoint.sh
ENV BUILD_ENV='dev'
COPY .env /etc/profile.d/
RUN cp '/etc/profile.d/.env' '/etc/profile.d/tag.sh'
RUN dos2unix /etc/profile.d/tag.sh
RUN sed -i "s/TAG=/export TAG=/g" /etc/profile.d/tag.sh


# Start the webserver
CMD ["/bin/bash", "/root/start.sh"]

# EXPOSE 443
EXPOSE 5080
WORKDIR /appsrc/lab/
ENTRYPOINT ["/root/entrypoint.sh"]
