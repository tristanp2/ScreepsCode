var source_manager = require('source_handling');
var util = require('utilities');

var roleRepairer = {
    /** @param {Creep} creep **/
    run: function(creep, room_info, room_memory) {
        var moveResult;
        source_manager.get_source(creep, room_info);
        if (!creep.memory.job_id || (room_info.urgent_repair > 0 && !creep.memory.urgent)) {
            var job = room_info.repairsQ.dequeue();
            if (job) {
                if (room_info.urgent_repair > 0) {
                    creep.memory.urgent = true;
                    room_info.urgent -= 1;
                    if (creep.memory.job_id) {
                        delete Memory.active_jobs[creep.memory.job_id];
                    }
                }
                creep.memory.job_id = job.id;
                job.workers.push(creep.name);
                job.num_workers++;
                if(!Memory.active_jobs[job.id]){
                    Memory.active_jobs[job.id] = job;
                }
            }
            else{
                creep.memory.job_id = 0;
            }
        }
        else{
            var job = Memory.active_jobs[creep.memory.job_id];
            var target = Game.getObjectById(creep.memory.job_id);
            if(!job || !target || target.hits >= job.completion){
                delete Memory.active_jobs[creep.memory.job_id];
                creep.memory.job_id = 0;
                creep.memory.urgent = false;
            }           
        }
        if(creep.memory.repairing && creep.carry.energy == 0) {
            creep.memory.repairing = false;
            creep.say('harvesting');
	    }
	    if(!creep.memory.repairing && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.repairing = true;
	        creep.say('repairing');
	    }
	    if (creep.memory.repairing) {
	        if(creep.memory.job_id != 0){
	            var job = Memory.active_jobs[creep.memory.job_id];
	            var target = Game.getObjectById(job.id);
                if (creep.repair(target) == ERR_NOT_IN_RANGE) {
	                moveResult = creep.moveTo(target);
	            }
                if (target.hits >= job.completion) {
                    delete Memory.active_jobs[job.id];
                    creep.memory.job_id = 0;   
                    creep.memory.urgent = false;
	            }
            }
            else {
                let pos = util.get_most_open_adjacent_pos(creep.pos);
                if(pos != creep.pos) {
                    creep.moveTo(pos);
                    console.log("creep moving to emptier position");
                }
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
                    moveResult = creep.moveTo(container);
                }
            }
            else if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                moveResult = creep.moveTo(source);
            }

        }
        console.log('move result: ' + moveResult);
    }
};

module.exports = roleRepairer;