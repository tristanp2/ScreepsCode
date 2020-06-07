var utils = require('utilities');

var roleSoldier = {

    /** @param {Creep} creep **/
    run: function(creep, room_info) {
        creep.say('soldier');
        if(!room_info.hostiles_present && !room_info.assault_target){
            creep.moveTo(Game.flags['rest_point']);
        }
	    else if(!creep.memory.target_id){
            var target = creep.room.find(FIND_HOSTILE_CREEPS)[0];
            if(target){
                creep.memory.target_id = target.id;
            }
            else{
                creep.memory.target_id = 0;
            }
        }
        else {
            var target = Game.getObjectById(creep.memory.target_id);
            if(target){
                var result = creep.rangedAttack(target);
                if(result == ERR_NOT_IN_RANGE){
                    creep.moveTo(target);
                }
            }
            else{
                creep.memory.target_id = 0;
            }
        }
	}
};

module.exports = roleSoldier;