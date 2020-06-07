var utils = require('utilities');

var source_manager = {
    get_source: function(creep, room_info){
        var room = Game.rooms[room_info.room_name];
        var max_per_source = Math.ceil((room_info.num_repairers + room_info.num_harvesters + room_info.num_builders + room_info.num_upgraders) / room.memory.num_sources) + 1;
        if(!creep.memory.source_id){
            var source = room.find(FIND_SOURCES, {
            filter: function(source){
                return source.memory.workers <= max_per_source;
                    }
            })[0];
            if(!source){
                var source = room.find(FIND_SOURCES)[0];  
            }
            creep.memory.source_id = source.id;
            Game.getObjectById(creep.memory.source_id).memory.workers++;        
        }else{
            var source = Game.getObjectById(creep.memory.source_id);
            if(source && !source.memory){
                Game.notify('source ' + source.id + 'has no memory alias\n'
                            +'In room: ' + source.room.name);
            }
            if(source.memory && source.memory.workers > max_per_source){
                var new_source = room.find(FIND_SOURCES, {
                filter: function(pot_source){
                    return pot_source.id != source.id; 
                    }
                })[0];
                source.memory.workers--;
                new_source.memory.workers++;
                creep.memory.source_id = new_source.id;
                if(new_source.memory.container_id)   creep.memory.container_id = new_source.memory.container_id;
                utils.log("Switching from " + source.id +  " to " + new_source.id);
                utils.log("Old: " + source.memory.workers + " New: " + new_source.memory.workers + " max_per_source: " + max_per_source);
            }
            else if(!source){
                creep.memory.source_id = 0;
            }
        }
    }
};
module.exports = source_manager;