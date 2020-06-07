/*
 *  Reservation process:
 *      Room has list of reserved rooms and list of rooms yet to be reserved
 *      To reserve: 
 *          1. Manually add name of room to list of rooms to be reserved in memory
 *          2. If valid (has controller and is in range), the room will be added to the list of reserve targets
 *          3. List of reserved rooms are iterated through, checking if their reservations are still active.
 *          4. Any room found without an active registration is moved to reserve targets
 *          5. Reserver gets target from reserve targets in memory
 *
 *      Reservers are spawned when reserve targets exist
 */

var utils = require('utilities');

var reserver = {
    run: function(creep, room_info){
        if(!creep.memory.route || creep.memory.route < 0){
            creep.memory.reserved = false;
            creep.memory.route = Game.map.findRoute(creep.room, creep.memory.target_room);
        }
        else if(creep.room.name != creep.memory.target_room){
            var exit = creep.pos.findClosestByRange(creep.memory.route[0].exit);
            creep.moveTo(exit)
        }
        else{
            var result = creep.reserveController(creep.room.controller)
            if(result == ERR_NOT_IN_RANGE){
                creep.moveTo(creep.room.controller);
            }
            else if(result != OK){
                utils.log(creep.name + ' encountered unhandled error: ' + result);
            }
            else{
                creep.memory.reserved = true;
                if(!Memory.reserved_rooms[creep.memory.target_room]){
                    Memory.reserved_rooms[creep.memory.target_room] = {controller_id: creep.room.controller.id, creep_id: creep.id};
                }
            }
        }
    }
}

module.exports = reserver;