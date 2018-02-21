var source_manager = require('source_handling');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep, room_info) {
        source_manager.get_source(creep, room_info);
        if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
            creep.say('harvesting');
	    }
	    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.upgrading = true;
	        creep.say('upgrading');
	    }
	    if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
        else {
            var result;
            var source = Game.getObjectById(creep.memory.source_id);
            var container = Game.getObjectById(source.memory.container_id);
            if(container && container.store[RESOURCE_ENERGY] > 0){
                var result = creep.withdraw(container, RESOURCE_ENERGY);
                if(result == ERR_NOT_IN_RANGE){
                    //creep.say('container!');
                    creep.moveTo(container);
                }
            }
            else if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                result = creep.moveTo(source);
            }
        }
    }
};

module.exports = roleUpgrader;