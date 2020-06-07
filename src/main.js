var roomBehaviour = require('room_behaviour');
var utils = require('utilities');
Source.prototype.memory = undefined;
StructureContainer.prototype.memory = undefined;


module.exports.loop = function () {
    utils.log('------------TICK START-----------');
    global.username = 'tpart';
    var num_harvesters = 6;
    var num_builders = 6;
    var num_upgraders = 1;
    var num_repairers = 4;
    var num_soldiers = 2;
    var num_sources = 0;
    var num_containers = 0;
    var towers;
    var spawn_nums = { harvesters: num_harvesters, builders: num_builders, upgraders: num_upgraders, repairers: num_repairers, soldiers: num_soldiers };
    
    if(!Memory.reserved_rooms){
        Memory.reserved_rooms = {};
    }
    if(!Memory.to_reserve){
        Memory.to_reserve = [];
    }
    if(!Memory.reserve_input){
        Memory.reserve_input = '';
    }
    else if(Memory.reserve_input != ''){
        utils.log('Reserve input found');
        Memory.to_reserve.push(Memory.reserve_input);
        Memory.reserve_input = '';
    }
    for(var i in Memory.reserved_rooms){
        var controller = Game.getObjectById(Memory.reserved_rooms[i].controller_id);
        if(controller){
            if(controller.reservation){
                Memory.reserved_rooms[i].ticks = controller.reservation.ticksToEnd;
            }
            else{
                Memory.reserved_rooms[i].ticks = 0;
            }
        }
        else{
            Memory.reserved_rooms[i].ticks--;
        }
        var id = Memory.reserved_rooms[i].creep_id;
        var creep = Game.getObjectById(id);
        if(!creep && Memory.reserved_rooms[i].ticks <= 1900){
                Memory.to_reserve.push(i);
                delete Memory.reserved_rooms[i];
        }
    }
    
    for(var name in Memory.creeps){
            if(!Game.creeps[name]){
                var creep_mem = Memory.creeps[name];
                if (creep_mem.job_id) {
                    var job = Memory.active_jobs[creep_mem.job_id];
                    for (var i in job.workers) {
                        var worker_name = job.workers[i];
                        if (worker_name == name) {
                            delete job.workers[i];
                            job.num_workers--;
                            break;
                        }
                    }
                    if (job.num_workers <= 0) {
                        delete Memory.active_jobs[creep_mem.job_id];
                    }
                }
                switch(creep_mem.role){
                    case 'slave':
                        var cont = Game.getObjectById(creep_mem.container_id);
                        if(cont) cont.memory.occupied = false;
                        break;
                }
                delete Memory.creeps[name]
            }
    }
    for(var roomName in Game.rooms){
        utils.log('------------' + roomName + ' START-----------');
        var room = Game.rooms[roomName];
        room.spawn = _.filter(Game.spawns, (spawn) => spawn.room.name == roomName)[0];
        room.creeps = room.find(FIND_MY_CREEPS);
        room.structures = room.find(FIND_STRUCTURES);
        if(!room.memory.sources){
            room.memory.sources = {};
            var sources = room.find(FIND_SOURCES);
            for(var i in sources){
                var source = sources[i];
                source.memory = room.memory.sources[source.id] = {};
                source.memory.workers = 0;
            }
        }
        else{
            var sources = room.find(FIND_SOURCES);
            var creeps = room.creeps;
            for(var i in sources){
                var source = sources[i];
                var real_count = 0;
                for(var j in creeps){
                    var creep = creeps[j];
                    if(creep.memory.source_id == source.id){
                        real_count++;
                    }
                }
                if(!room.memory.sources[source.id]){
                    room.memory.sources[source.id] = {};
                }
                else if(!room.memory.sources[source.id].container_id){
                    
                }
                source.memory = room.memory.sources[source.id];
                //TEMPORARY
                source.memory.workers = real_count;
                num_sources++;
            }
            room.memory.num_sources = num_sources;
        }
       
        if(!room.memory.containers){
            room.memory.containers = {};
            var containers = room.find(FIND_STRUCTURES, {filter: function(structure){
                return structure.structureType == STRUCTURE_CONTAINER;
            }});
            if(containers.length > 0){
                for(var i in containers){
                    var cont = containers[i];
                    cont.memory = room.memory.structures[cont.id] = {};
                    cont.memory.occupied = false;
                }
                num_containers = containers.length;
            }
        }
        else{
            var containers = room.find(FIND_STRUCTURES, {filter: function(structure){
                return structure.structureType == STRUCTURE_CONTAINER;
            }});            
            for(var i in containers){
                var cont = containers[i];
                if(!room.memory.containers[cont.id]){
                    room.memory.containers[cont.id] = {};
                    room.memory.containers[cont.id].occupied = false; 
                }
                
                cont.memory = room.memory.containers[cont.id];
                if(!cont.memory.slave_name == "" && !Game.creeps[cont.memory.slave_name]){
                    cont.memory.slave_name = '';
                    cont.memory.occupied = false;
                };
                num_containers++;
            }
            
        }
        room.memory.num_containers = num_containers
        towers = room.find(FIND_STRUCTURES, {filter: function(structure){
                return structure.structureType == STRUCTURE_TOWER;
                }});
        if(!room.memory.towers){
            room.memory.towers = {};
            for(var i in towers){
                var tower = towers[i];
                tower.memory = room.memory.structures[tower.id] = {};
            }
        }
        else{
            for(var i in towers){
                var tower = towers[i];
                if(!room.memory.towers[tower.id]){
                    room.memory.towers[tower.id] = {};
                    room.memory.towers[tower.id].target_id = 0;
                }
                
                tower.memory = room.memory.towers[tower.id];
            }
        }
        roomBehaviour.init(room, spawn_nums)
        roomBehaviour.run();
    }
    var alpha = 0.01;
    var used = Game.cpu.getUsed();
    if(!Memory.cpu_avg){
        Memory.cpu_avg = used;
       
    }
    else{
        if(!Memory.max_cpu || Memory.max_cpu < used){
                Memory.max_cpu = used;
                Memory.max_cpu_count = 0;
        }
        else if(Memory.max_cpu_count >= 1000){
            Memory.max_cpu = 0;
            Memory.max_cpu_count = 0;
        }
        else{
            Memory.max_cpu_count++;
        }
        Memory.cpu_avg = used*alpha + Memory.cpu_avg*(1-alpha);
    }
    utils.log('avg cpu usage: ' + Memory.cpu_avg);
    utils.log('------------TICK END-----------');
    utils.log();
}