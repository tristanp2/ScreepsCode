var Spawner = {
	run: function(spawn, spawn_nums, room_info){
	    this.available = spawn.room.energyAvailable;
	    this.capacity = spawn.room.energyCapacityAvailable;
        console.log(spawn.room.name + ' capacity: ' + this.capacity);
        console.log(spawn.room.name + ' available ' + this.available);
        
        this.spawn = spawn;
        
        if(spawn.memory.current_tier == undefined){
            spawn.memory.current_tier = 0;
        }
        //to handle bugs that happen while not in game
        if(!spawn.memory.recover && room_info.num_harvesters == 0){
            spawn.memory.current_tier = 0;
            spawn.memory.recover = true;
            spawn.memory.next_spawn = undefined;
        }
        else if(spawn.memory.recover && room_info.num_harvesters > spawn_nums.harvesters/2){
            spawn.memory.recover = false;
            Game.notify(spawn.name + ' recovered');
        }
        
        this.current_tier = spawn.memory.current_tier;
        if(!spawn.memory.recover){
            if(!spawn.memory.cost_threshold){
                console.log('getting thresh');
                this.get_threshold();
            }
            else if(spawn.memory.current_tier < CreepBodies.max_tier && this.capacity > spawn.memory.cost_threshold){
                spawn.memory.current_tier++;
                this.current_tier = spawn.memory.current_tier;
                
                this.get_threshold();
            }
            else if(this.capacity < spawn.memory.cost_threshold){
                console.log('should decrease');
            }
        }
        console.log(spawn.name + ' tier: ' + this.current_tier);
        var next_spawn = spawn.memory.next_spawn;
        
        if(!next_spawn && !spawn.spawning){
            console.log('attempting to set next spawn for ' + spawn.room.name + ': ' + spawn.name);
            var next_role;
            var mem = {};
            if(room_info.num_soldiers < spawn_nums.soldiers && this.can_create('slave'))
            {
                next_role = 'soldier';
            }
            else if(room_info.num_harvesters < spawn_nums.harvesters && this.can_create('harvester')){
                next_role = 'harvester';
            }
            else if(room_info.num_builders < spawn_nums.builders && this.can_create('builder')){
                next_role = 'builder';
            }
            else if(room_info.num_upgraders < spawn_nums.upgraders && this.can_create('upgrader')){
                next_role = 'upgrader';
            }
            else if(room_info.num_repairers < spawn_nums.repairers && this.can_create('repairer')){
                next_role = 'repairer';
            }
            else if(room_info.num_slaves < room_info.num_containers && this.can_create('slave')){
                next_role = 'slave';
            }
            else if(spawn.room.memory.reserve_targets.length > 0 && this.can_create('reserver')){
                mem.target_room = spawn.room.memory.reserve_targets.pop();
                next_role = 'reserver';
            }
            
            if(next_role){
                mem.role = next_role;
                this.prepare_next(next_role, mem);
                console.log('next spawn set to: ' + next_role);
            }
            else{
                console.log('next spawn not set');
            }
        }
        else if(next_spawn && BodyCost(next_spawn.body) <= spawn.room.energyAvailable){
            var result = spawn.createCreep(next_spawn.body, undefined, next_spawn.memory);
            var creep = Game.creeps[result];
            spawn.memory.next_spawn = undefined;
        }
        else{
            if(!spawn.spawning){
                console.log('waiting on energy to spawn: ' + next_spawn.memory.role + '\tenergy required: ' + BodyCost(next_spawn.body));
            }
        }
	},
	prepare_next: function(role, mem){
		var body = GetBody(role, this.current_tier);
	    var next_spawn = new Spawnable(mem,body);
		this.spawn.memory.next_spawn = next_spawn;
	},
	can_create: function(role){
	    var cost = BodyCost(GetBody(role, this.current_tier));
	    return cost <= this.capacity;
	},
	get_threshold: function(){
	    //gotta make some wider scope stuff for this
	    var roles = ['soldier','harvester','builder','upgrader','repairer','slave', 'reserver']
	    var max = 0;
	    for(var i in roles){
	        var role = roles[i];
	        var body = GetBody(role, this.current_tier+1);
	        var temp = BodyCost(GetBody(role, this.current_tier+1));
	        if(temp > max)
	            max = temp;
	    }
	    this.spawn.memory.cost_threshold = max;
	}
}
function GetBody(role, tier){
    switch(role){
        case 'soldier':
			var max_tier = CreepBodies.soldier.max_tier;
			return CreepBodies.soldier.tier[Math.min(max_tier, tier)];
		case 'harvester':
			var max_tier = CreepBodies.harvester.max_tier;
			var min_tier = Math.min(max_tier, tier);
			return CreepBodies.harvester.tier[Math.min(max_tier, tier)];
		case 'builder':
			var max_tier = CreepBodies.builder.max_tier;
			return CreepBodies.builder.tier[Math.min(max_tier, tier)];
		case 'upgrader':
			var max_tier = CreepBodies.upgrader.max_tier;
			return CreepBodies.upgrader.tier[Math.min(max_tier, tier)];
		case 'repairer':
			var max_tier = CreepBodies.repairer.max_tier;
			return CreepBodies.repairer.tier[Math.min(max_tier, tier)];
		case 'slave':
			var max_tier = CreepBodies.slave.max_tier;
			return CreepBodies.slave.tier[Math.min(max_tier, tier)];
		case 'reserver':
		    var max_tier = CreepBodies.reserver.max_tier;
		    return CreepBodies.reserver.tier[Math.min(max_tier, tier)];
    }
}
function Spawnable(memory,body){
	this.memory = memory;
	this.body = body;
}
function BodyCost(body){
	var sum = 0;
	for(var i in body){
	    var part = body[i];
	    var cost = BODYPART_COST[part];
		sum += cost;
	}
	return sum;
}

var CreepBodies = {
    max_tier: 2,
	soldier: { tier: [  [WORK,WORK,RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE]
	                    ], max_tier: 0},
	harvester: { tier: [    [WORK,CARRY,MOVE],
	                        [WORK,WORK,CARRY,CARRY,MOVE,MOVE]], max_tier: 1},
	builder: { tier: [  [WORK,CARRY,MOVE],
	                    [WORK,WORK,CARRY,CARRY,MOVE,MOVE]], max_tier: 1},
	upgrader:  { tier: [[WORK,CARRY,MOVE],
	                    [WORK,WORK,CARRY,CARRY,MOVE,MOVE]], max_tier: 1},
	repairer:  { tier: [[WORK,CARRY,MOVE],
	                    [WORK,WORK,CARRY,CARRY,MOVE,MOVE]], max_tier: 0},//dont think i need a bigger bodied repairer
	slave: {tier: [[WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE],
	                    [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE]], max_tier: 1},
	reserver: {tier: [[CLAIM,MOVE],[CLAIM,MOVE],[CLAIM,CLAIM,MOVE,MOVE]], max_tier: 2},
}

module.exports = Spawner;