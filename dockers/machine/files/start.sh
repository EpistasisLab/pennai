cd ${IFROOT}/Gp/machine
for metadata in `find ${IFROOT}/Gp/machine/datasets/ | grep metadata`;do rm -f $metadata;done
rm -f ${IFROOT}/Gp/machine/specs.json
pm2 start machine.config.js --watch
bash
