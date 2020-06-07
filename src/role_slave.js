var source_manager = require('source_handling');
var utils = require('utilities');

var roleSlave = {
    run: function(creep, room_info) {
        if(!creep.memory.target_id){
            creep.memory.target_id = 0;
            for(var i in creep.room.memory.sources){
                var source = Game.getObjectById(i);
                if(source){
                    var container = Game.getObjectById(source.memory.container_id);
                    if(container && !container.memory.occupied){
                        creep.memory.target_id = container.id;
                        container.memory.occupied = true;
                        container.memory.slave_name = creep.name;
                        break;
                    }
                    else if(!container){
                        creep.memory.target_id = 0;
                    }
                }
            }
        }
        else{
            var target = Game.getObjectById(creep.memory.target_id);
            var source = Game.getObjectById(creep.memory.source_id);
            if(!target){
                var flag = Game.flags['rest_point'];
                if(!creep.pos.isEqualTo(flag.pos)) {
                    creep.moveTo(flag);
                }
            }
            else {
                if(!creep.pos.isEqualTo(target.pos)){
                    creep.say('moving');
                    creep.moveTo(target);
                }
                else{
                    if(!creep.memory.source_id){
                        var source = creep.pos.findClosestByRange(FIND_SOURCES);
                        if(source){
                            creep.memory.source_id = source.id;
                            source.memory.container_id = target.id;
                        }
                        else{
                            creep.memory.source_id = 0;
                        }
                    }
                    var source = Game.getObjectById(creep.memory.source_id);
                    if(!source.memory.container_id){
                        source.memory.container_id = creep.memory.target_id;
                    }
                    var result = creep.harvest(source);
                    if(result == ERR_NOT_IN_RANGE){
                        creep.moveTo(source);
                    }
                    creep.transfer(target, RESOURCE_ENERGY);
                }
            }
        }
    }
};

module.exports = roleSlave;