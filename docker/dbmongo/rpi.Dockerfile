FROM arm64v8/mongo:bionic
WORKDIR /opt/

ARG docker_filepath=docker/dbmongo/files

#add repo for mongodb
#RUN echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list
#RUN apt-get update --fix-missing && \
#  apt-get install -y wget gnupg
#RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | apt-key add -
 
#RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.2.list

RUN apt-get update --fix-missing && \
  apt-get install -y --allow-unauthenticated \
  npm openssh-client htop dos2unix \
  net-tools iputils-ping \
  --no-install-recommends && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

#check if we need to rebuild
COPY ${docker_filepath}/mongod.conf /etc/
COPY ${docker_filepath}/users.json /root/
COPY ${docker_filepath}/projects.json /root/
COPY ${docker_filepath}/entrypoint.sh /root/
COPY ${docker_filepath}/sync.sh /root/
RUN dos2unix /root/entrypoint.sh /root/sync.sh
RUN dos2unix /root/users.json /root/projects.json
RUN dos2unix /etc/mongod.conf

EXPOSE 27017

CMD ["/bin/bash", "/root/entrypoint.sh"]
