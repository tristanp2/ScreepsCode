/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utilities');
 * mod.thing == 'a thing'; // true
 */

var utilities = {
    get_most_open_adjacent_pos: function(pos){
        var adj_info = this.get_adjacent_pos_info(pos);
        var max = 0;
        var best_index = 0;
        
        for(var i in adj_info){
            var info = adj_info[i];
            if(info.num_open > max){
                max = info.num_open;
                best_index = i;
            }
        }
        
        return adj_info[best_index].pos;
    },
    get_adjacent_pos_info: function(pos){
        var adjacent = this.get_adjacent_pos(pos);
        var ret = [];
        for(var i in adjacent){
            var p = adjacent[i];
            var p_adjacent = this.get_adjacent_pos(p);
            var num_open = 0;
            for(var j in p_adjacent){
                if(Game.map.getTerrainAt(p_adjacent[j]) != 'wall'){
                    num_open++;
                }
            }
            ret.push({pos: p, num_open: num_open});
        }
        return ret;
    },
    get_adjacent_pos: function(pos){
        var room = Game.rooms[pos.roomName];
        var west = room.getPositionAt(pos.x - 1, pos.y);
        var east = room.getPositionAt(pos.x + 1, pos.y);
        var north = room.getPositionAt(pos.x, pos.y - 1);
        var south = room.getPositionAt(pos.x, pos.y + 1);
        var nw = room.getPositionAt(pos.x - 1, pos.y - 1);
        var ne = room.getPositionAt(pos.x + 1, pos.y - 1);
        var sw = room.getPositionAt(pos.x - 1, pos.y + 1);
        var se = room.getPositionAt(pos.x + 1, pos.y + 1);
        

        var ret = [west,east,north,south, nw, ne, sw, se];
        for(var i in ret){
            var pos = ret[i];
            if(Game.map.getTerrainAt(pos) == 'wall'){
                ret.splice(i,1);
            }
        }
        return ret;
    },
}

module.exports = utilities;