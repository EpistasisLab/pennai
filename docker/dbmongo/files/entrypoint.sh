#figure out where we are running
wget localhost:51678/v1/metadata -t 1 -qO- &> /dev/null
if [ ! -v PROJECTS_FILE ]; then
    PROJECTS_FILE='projects.json';
fi
if [ ! -d /var/lib/mongodb ]; then
    mkdir -p /var/lib/mongodb;
fi
mongod -f /etc/mongod.conf --fork
#check to see if db was loaded
if [ ! -f '/root/forum' ]; then
    mongoimport -d FGLab -c users --file /root/users.json --type json --jsonArray
    mongoimport -d FGLab -c projects --file /root/${PROJECTS_FILE} --type json --jsonArray
    mongo FGLab --eval 'db.projects.createIndex({name: 1})'
    mongo FGLab --eval 'db.users.createIndex({username: 1})'
    mongo FGLab --eval 'db.users.createIndex({apikey: 1})'
    mongo FGLab --eval 'db.datasets.createIndex({username: 1})'
    mongo FGLab --eval 'db.datasets.createIndex({name: 1})'
    mongo FGLab --eval 'db.experiments.createIndex({username: 1})'
    mongo FGLab --eval 'db.experiments.createIndex({_dataset_id: 1})'
    mongo FGLab --eval 'db.settings.createIndex({type: 1})'

    touch /root/forum
fi

bash
