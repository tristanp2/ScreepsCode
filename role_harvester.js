var source_manager = require('source_handling');
var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep, room_info) {
        source_manager.get_source(creep, room_info);
        if(creep.memory.harvesting && creep.carry.energy == creep.carryCapacity){
            creep.memory.harvesting = false;
        }
        else if(!creep.memory.harvesting && creep.carry.energy == 0){
            creep.memory.harvesting = true;
        }
        
	    if(creep.memory.harvesting) {
            var result;
            var source = Game.getObjectById(creep.memory.source_id);
            var container = Game.getObjectById(source.memory.container_id);
            if(room_info.dropped_resource.length > 0){
                var resource = room_info.dropped_resource[0];
                if(creep.pickup(resource) == ERR_NOT_IN_RANGE){
                    creep.moveTo(resource);
                }
            }
            else if(container && container.store[RESOURCE_ENERGY] > 0){
                var result = creep.withdraw(container, RESOURCE_ENERGY);
                if(result == ERR_NOT_IN_RANGE){
                   // creep.say('container!');
                    creep.moveTo(container);
                }
            }
            else if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                result = creep.moveTo(source);
            }
	    } 
        else {
            var target;
            if(creep.memory.target_id){
                target = Game.getObjectById(creep.memory.target_id);
            }
            if(!target || target.energy >= target.energyCapacity){
                var targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_TOWER) &&
                                structure.energy < structure.energyCapacity;
                        }
                });
                target = targets[0];
                if(target) creep.memory.target_id = target.id;
            }
            if(target && creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            else{
               	var target = creep.room.controller;
    	    	if(creep.upgradeController(target) == ERR_NOT_IN_RANGE){
    	    		creep.moveTo(target);
    	    	}
            }
        }
	}
};

module.exports = roleHarvester;