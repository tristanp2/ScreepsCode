var utils = require('utilities');
var roleHarvester = require('role_harvester');
var roleUpgrader = require('role_upgrader');
var roleBuilder = require('role_builder');
var roleRepairer = require('role_repairer');
var roleSlave = require('role_slave');
var roleSoldier =  require('role_soldier');
var roleReserver = require('role_reserver');

module.exports = {
    init(room) {
        this.room = room;
    },
    run() {
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


        utils.log(this.room.creeps.length);
        for(var name in this.room.creeps) {
            var creep = this.room.creeps[name];
            utils.log(creep.name +  ': ' + creep.memory.role);
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
        }
        
    },
}