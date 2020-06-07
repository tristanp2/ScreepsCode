var roleHarvester = require('role_harvester');
var roleUpgrader = require('role_upgrader');
var roleBuilder = require('role_builder');
var roleRepairer = require('role_repairer');
var roleSlave = require('role_slave');
var roleSoldier =  require('role_soldier');
var roleReserver = require('role_reserver');
var towerDefense = require('tower_defense');
var utils = require('utilities');
var spawner = require('spawner');

var roomBehaviour = {
    /********
    * Properties
    ********/

    room: undefined,
    spawn_nums: undefined,
    construction_sites: undefined,
    repairsQ: undefined,
    structures: undefined,
    defenseHits: undefined,
    spawner: undefined,

    /********
    * Methods
    ********/

    init: function(room, spawn_nums){
        this.room = room;
        this.spawn_nums = spawn_nums;
        if (!room.memory.num_soldiers)
            room.memory.num_soldiers = 2;
        this.structures = room.find(FIND_STRUCTURES);
        this.construction_sites = room.find(FIND_CONSTRUCTION_SITES);
        if (!room.memory.defenseHits) {
            room.memory.defenseHits = 2000;
        }
        if (!room.memory.reserve_targets){
            room.memory.reserve_targets = [];
        }
        this.defenseHits = room.memory.defenseHits;
    },
    run: function(){
        this.manage_repairs();
        var harvesters = _.filter(this.room.creeps, (creep) => creep.memory.role == 'harvester');
        var builders = _.filter(this.room.creeps, (creep) => creep.memory.role == 'builder');
        var upgraders = _.filter(this.room.creeps, (creep) => creep.memory.role == 'upgrader');
        var repairers = _.filter(this.room.creeps, (creep) => creep.memory.role == 'repairer');
        var slaves = _.filter(this.room.creeps, (creep) => creep.memory.role == 'slave');
        var soldiers = _.filter(this.room.creeps, (creep) => creep.memory.role == 'soldier');
        var reservers = _.filter(this.room.creeps, (creep) => creep.memory.role == 'reserver');
        var constr_sites_present = this.room.find(FIND_CONSTRUCTION_SITES).length > 0;
        var hostiles_present = this.room.find(FIND_HOSTILE_CREEPS).length > 0;
        var num_sources = this.room.find(FIND_SOURCES).length;
        var num_containers = _.filter(this.room.structures, (structure) => structure.structureType == STRUCTURE_CONTAINER).length;
        var towers = towers = this.room.find(FIND_STRUCTURES, {filter: function(structure){
                    return structure.structureType == STRUCTURE_TOWER;
                    }});
        var ext_energy = 0;
        var walls_maxed = true;
        
        for(var i in this.room.memory.reserve_targets){
            var name = this.room.memory.reserve_targets[i];
            utils.log(name + '?');
            if(Memory.reserved_rooms[name]){
                utils.log('deleting from targs');
                this.room.memory.reserve_targets.splice(i,1);
            }
        }
        
        if(this.room.spawn && Memory.to_reserve.length > 0){
            for(var i in Memory.to_reserve){
                var name = Memory.to_reserve[i];
                if(name){
                    var dist = Game.map.getRoomLinearDistance(this.room.name, name);
                    if(dist < 3){
                        utils.log('adding ' + name + ' to reserve_targets');
                        this.room.memory.reserve_targets.push(name);
                        utils.log(this.room.memory.reserve_targets);
                        Memory.to_reserve.splice(i,1);
                    }
                    else{
                        utils.log(name + ' too far\tdist: ' + dist);
                    }
                }
                else{
                    utils.log(name + ' reserve target not found');
                    Memory.to_reserve.splice(i,1);
                }
            }
        }
        if (!this.room.memory.rebuild_structures) {
            this.room.memory.rebuild_structures = {};
        }
       
        if (!this.room.memory.spawn_info){
            this.room.spawn.memory = this.room.memory.spawn_info = {};
        }
       
        var num_defenses = 0;
        for(var name in this.room.structures){
            var struct = this.room.structures[name];
            if (!this.room.memory.rebuild_structures[struct.id]) {
                struct_mem = this.room.memory.rebuild_structures[struct.id] = {};
                struct_mem.pos = struct.pos;
                struct_mem.type = struct.structureType;
            }
           
            if (struct.structureType == STRUCTURE_WALL && struct.hits) {
                num_defenses++;
            }
            else if(struct.structureType == STRUCTURE_RAMPART){
                num_defenses++;
                if(walls_maxed && struct.hits < 2*this.defenseHits)
                    walls_maxed = false;
            }
            else if(struct.structureType == STRUCTURE_EXTENSION)
                ext_energy += struct.energy;
        }
        
        //This is to allow structures to be deleted by me
        //Structure is rebuilt when destroyed normally
        if (this.room.memory.remove_structure == undefined){
            this.room.memory.remove_structure = '';
        }
        else if(this.room.memory.remove_structure != ''){
            utils.log('-----------------------------------------------');
            var id = this.room.memory.remove_structure;
            var struct = Game.getObjectById(id);
            this.room.memory.remove_structure = '';
            if(struct && this.room.memory.rebuild_structures[struct.id]){
                utils.log(typeof(struct));
                utils.log('deleting ' + struct.id + ' in ' + this.room.name);
                struct.destroy();
                delete Memory.rooms[this.room.name].rebuild_structures[struct.id];
            }
            else{
                utils.log('could not locate structure with id: ' + id);
            }
            utils.log('-----------------------------------------------');
        }
        //Temporary. Planning to automatically place construction sites at destroyed structures
        //But this maybe should wait until I implement job delegation for builders
        for (var id in this.room.memory.rebuild_structures) {
            var struct = Game.getObjectById(id);
            var mem = this.room.memory.rebuild_structures[id];
            if (!struct) {
                var result = this.room.createConstructionSite(parseInt(mem.pos.x), parseInt(mem.pos.y), mem.type);
                Game.notify(mem.type + ' is missing. creating construction site at ' + JSON.stringify(mem.pos) + 
                ' \nResult is: ' + result);
                utils.log(id + ' is missing. creating construction site at ' + JSON.stringify(mem.pos) + 
                ' \nResult is: ' + result);
                delete this.room.memory.rebuild_structures[id];
            }
        }
        for(var id in this.room.memory.sources){
            var source = Game.getObjectById(id);
            if(source && !source.memory.container_id){
                var container_pos = utils.get_most_open_adjacent_pos(source.pos);
                var structs = container_pos.lookFor(LOOK_STRUCTURES);
                var sites = container_pos.lookFor(LOOK_CONSTRUCTION_SITES);
                if(sites.length > 0)
                    continue;
                var container_id;
                for(var i in structs){
                    var struct = structs[i];
                    if(struct.structureType == STRUCTURE_CONTAINER){
                        container_id = struct.id; 
                        break;
                    }
                }
                if(container_id){
                    source.memory.container_id = container_id; 
                    Game.getObjectById(container_id).memory.resource_type = RESOURCE_ENERGY;
                }
                else{
                    utils.log('no containers found for source: ' + source.id);
                    utils.log('attempting to create construction site at: ' + JSON.stringify(container_pos));
                    var result = this.room.createConstructionSite(container_pos, STRUCTURE_CONTAINER);
                    utils.log('result is: ' + result);
                }
            }
            else if(source){
                var cont = Game.getObjectById(source.memory.container_id);
                if(!cont){
                    source.memory.container_id = 0;
                }
            }
        }
        for(var id in this.room.memory.containers){
            var cont = Game.getObjectById(id);
            if(!cont){
                delete this.room.memory.containers[id];
            }
            else if(cont.memory.slave_name){
                if(!Game.creeps[cont.memory.slave_name]){
                    cont.memory.slave_name = undefined;
                    cont.memory.occupied = false;
                }
            }
            else{
                cont.memory.occupied = false;
            }
        }
        utils.log('defensehits: ' + this.defenseHits);
        utils.log('num_defenses: ' + num_defenses);
        if(num_defenses == 0){
            this.defenseHits = 2000;
            this.room.memory.defenseHits = this.defenseHits;
        }
        else if (walls_maxed) {
            this.defenseHits *= 2;
            this.room.memory.defenseHits = this.defenseHits;
        }
        utils.log(this.room.name + '---> h:' + harvesters.length + ' b:' + builders.length + ' u:' + upgraders.length 
                    + ' rp:' + repairers.length + ' rs:' + reservers.length  + ' sl:' + slaves.length+ ' so:' + soldiers.length);
        
        var floor_resource = this.room.find(FIND_DROPPED_RESOURCES);
        utils.log('floor resources: ' + floor_resource.length);

        
        var room_info = {num_builders: builders.length, num_harvesters: harvesters.length, num_slaves: slaves.length,
                        num_upgraders: upgraders.length, num_repairers: repairers.length, num_containers: this.room.memory.num_containers,
                        room_name: this.room.name, hostiles_present: hostiles_present, csites_present: constr_sites_present,
                        repairsQ: this.repairsQ, urgent_repair:  this.urgent, assault_target: this.room.memory.assault_target, dropped_resource: floor_resource};
        if(this.room.spawn){
            spawner.run(this.room.spawn, this.spawn_nums, room_info);
        }
        for(var name in this.room.creeps) {
            var creep = this.room.creeps[name];
            //utils.log(creep.name +  ': ' + creep.memory.role);
            if(creep.memory.role == 'harvester') {
                roleHarvester.run(creep, room_info);
            }
            else if(creep.memory.role == 'upgrader') {
                if(creep.memory.upgrading == undefined){
                    creep.memory.upgrading = false;
                }
                roleUpgrader.run(creep, room_info);
            }
            else if(creep.memory.role == 'builder') {
                roleBuilder.run(creep, room_info);
            }
            else if(creep.memory.role == 'repairer'){
                roleRepairer.run(creep, room_info, this.room.memory);
            }
            else if(creep.memory.role == 'slave'){
                roleSlave.run(creep, room_info);
            }
            else if(creep.memory.role == 'soldier'){
                roleSoldier.run(creep, room_info);
            }
            else if(creep.memory.role == 'reserver'){
                roleReserver.run(creep, room_info);
            }
           // creep.say(creep.memory.role[0]);
        }
        if(hostiles_present){
            for(var i in towers){
                var tower = towers[i];
                towerDefense.run(tower);
            }
        }
        utils.log('Remaining urgent repairs: ' + this.urgent);
    },
    make_roads: function(){
          
    },
    manage_structures: function(){
          
    },
    manage_reservations: function(){
        
    },
    manage_sources: function(){
        
    },
    manage_construction: function() {
        this.constructionQ = new utils.Queue();
        var active_jobs = Memory.active_jobs
    },
    manage_repairs: function(){
        this.repairsQ = new utils.Queue();
        var active_jobs = Memory.active_jobs;
        if (this.urgent == undefined)
            this.urgent =  0;
        if(!active_jobs){
            active_jobs = Memory.active_jobs = {};
        }
        else {
            for (var i in active_jobs) {
                var job = active_jobs[i];
                if (job.type == utils.JobType.REPAIR) {
                    var struct = Game.getObjectById(job.id);
                   // utils.log('Onogoing repair: ' + job.id);
                   // utils.log('Hits: ' + struct.hits);
                   // utils.log('Completion' + job.completion);
                    if (!struct || struct.hits > job.completion) {
                        delete active_jobs[i];
                    }
                }
                job.ticksElapsed += 1;
            }
        }
        //this seems to explode the callstack
        /**
        var high_priority = _.filter(this.structures,   (structure) =>  !active_jobs[structure.id] 
                                                                    &&  (utils.isDefense(structure) && structure.hits < 300) 
                                                                    ||  (!utils.isDefense(structure) && structure.hits < structure.hitsMax/3));
        Note to self: don't do that (wish there were macros)*/

        var high_priority = _.filter(this.structures,   (structure) =>  !active_jobs[structure.id] && structure.hits!=undefined 
                                                                    &&  ((structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) && structure.hits < 1500) 
                                                                    ||  (!(structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) && structure.hits < structure.hitsMax/3));
        var the_rest = _.filter(this.structures,        (structure) =>   !active_jobs[structure.id] && structure.hits != undefined
                                                                    &&  (((structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) && structure.hits < 2*this.defenseHits) 
                                                                    ||  (!(structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) && structure.hits < 2*structure.hitsMax/3)));
        for (var i in high_priority) {
            var structure = high_priority[i];
            var job = new utils.Job();
            var completion;
            
            if(utils.isDefense(structure)){
                if(this.defenseHits < 10000)
                    completion = this.defenseHits;
                else
                    completion = 10000;
                    
                if (completion < structure.hits) {
                    utils.log('Invalid in hp');
                    utils.log(structure);
                    utils.log('hits: ' + structure.hits);
                    utils.log('comp: ' + completion);
                    continue;
                }
            }
            else{
                completion = structure.hitsMax;
            }
            job.init(structure.id, this.room.name, utils.JobType.REPAIR, 2, completion);
            this.repairsQ.enqueue(job);
        }
        this.urgent = high_priority.length;
        //yeah, yeah. code duplication. watev
        for(var i in the_rest){
            var structure = the_rest[i];
            if (structure.hits < structure.hitsMax) {
                var job = new utils.Job();
                var completion;
                if (utils.isDefense(structure)) {
                    completion = 2 * this.defenseHits;
                    if (completion < structure.hits) {
                        utils.log('Invalid in lp');
                        utils.log('Invalid in hp');
                        utils.log(structure);
                        utils.log('hits: ' + structure.hits);
                        utils.log('comp: ' + completion);
                        continue;
                    }
                }
                else{
                    completion = structure.hitsMax;
                }
                job.init(structure.id, this.room.name, utils.JobType.REPAIR, 1, completion);
                //This line is the problem
                //this.repairsQ.push(job);
                this.repairsQ.enqueue(job)                
                //utils.log('leaving problem code')
            }
        }
        utils.log(the_rest.length);
        utils.log('Repairs: ' + this.repairsQ.getLength());
    }
};
module.exports = roomBehaviour;