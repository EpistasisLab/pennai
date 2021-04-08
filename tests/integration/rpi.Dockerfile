FROM node:8.15.1-slim
WORKDIR /src

RUN apt-get update && apt-get install -y vim dos2unix

COPY package.json .
COPY tsconfig.json .
# RUN npm install --save es6-promise isomorphic-fetch
# RUN npm install --save-dev typescript jest ts-jest @types/jest
# RUN npm install --save-dev babel-jest babel-preset-react react-test-renderer babel-preset-es2015
# RUN npm install --save-dev babel-jest babel-preset-react react-test-renderer babel-preset-env
RUN npm install --no-optional --progress=false

COPY wait-for-it.sh /opt
RUN dos2unix /opt/wait-for-it.sh
RUN ["chmod", "+x", "/opt/wait-for-it.sh"]
COPY wait_pennai.sh /root
COPY int_test_runner.sh /root
RUN dos2unix /root/*.sh
