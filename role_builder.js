var source_manager = require('source_handling');

var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep, room_info) {
        source_manager.get_source(creep, room_info);
        if(room_info.csites_present && !creep.memory.building){
        	creep.memory.building = true;
        }
        else if(!room_info.csites_present && !creep.memory.defense_pos){
        	creep.memory.building = false;
        	creep.memory.defense_pos = 0;
        }
        if(creep.carry.energy == 0 && !creep.memory.harvesting){
        	creep.memory.harvesting = true;
        }
        else if(creep.memory.harvesting && creep.carry.energy == creep.carryCapacity){
        	creep.memory.harvesting = false;
        }
        if(creep.memory.harvesting && creep.carry.energy < creep.carryCapacity){
	        var source = Game.getObjectById(creep.memory.source_id);
    		var container = Game.getObjectById(source.memory.container_id)
	        if(container && container.store[RESOURCE_ENERGY] > 0){
	            if(creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
	                creep.moveTo(container);
	            }
	        }
	        else if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
           		creep.moveTo(source);
        	}
	    }
	    else if(creep.memory.building) {
	    	var target = Game.getObjectById(creep.memory.target_id);
	    	if(!target){
	    		if(creep.memory.defense_pos){
	    			var pos = creep.memory.defense_pos;
	    			console.log('looking for rampart at '  + pos.x + ' ' + pos.y);
	    			//this works
	    			targets = creep.room.lookForAt(LOOK_STRUCTURES, parseInt(pos.x), parseInt(pos.y));
	    			var found = false;
	    			for (var i in targets) {
	    			    var targ = targets[i];
	    			    console.log('Rampart? ' + targ);
	    			    if (targ.structureType == STRUCTURE_RAMPART) {
	    			        creep.memory.target_id = targ.id;
	    			        creep.memory.afterbuild = true;
	    			        found = true;
	    			        break;
	    			    }
	    			}
	    			if(!found){
	    				//console.log('rampart not found')
	    				//something has gone wrong?
	    				creep.memory.target_id = 0;
	    				creep.memory.afterbuild = false;
	    				creep.memory.defense_pos = 0;
	    			}
	    		}
	    		else {
	    			target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
		    		if(target){
		    			creep.memory.target_id = target.id;
		    			creep.memory.afterbuild = false;
		    			if(target.structureType == STRUCTURE_RAMPART){
		    				creep.memory.defense_pos = target.pos;
		    			}
		    			else{
		    				creep.memory.defense_pos = 0;
		    			}
		    		}
		    		else
		    			creep.memory.target_id = 0;
		    	}
	    	}
            if(target){
            	var result;
            	if(creep.memory.afterbuild){
            		//console.log('attempting repair');
            		result = creep.repair(target);
            		if(target.hits > 800 || result == ERR_INVALID_TARGET){
            			creep.memory.target_id = 0;
            			creep.memory.afterbuild = false;
            			creep.memory.defense_pos = 0;
            		}
            	}
                else{
                	//console.log('attempting build');
            	    result = creep.build(target);
                }
                //console.log('move cond ' + (result == ERR_NOT_IN_RANGE));
                //console.log('move cond: ' + result + ' == ' + ERR_NOT_IN_RANGE);
                //console.log(target);
                if(result == ERR_NOT_IN_RANGE){
                	//console.log('moving?');
                	creep.moveTo(target);
                }
            }
	    }
	    else {
	    	var target = creep.room.controller;
	    	if(creep.upgradeController(target) == ERR_NOT_IN_RANGE){
	    		creep.moveTo(target);
	    	}
	    }
	}
};

module.exports = roleBuilder;