/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utilities');
 * mod.thing == 'a thing'; // true
 */

 const showStackTrace = true;
 const stackTraceLimit = 1;
 const printWidth = 120;
function log() {
    if(showStackTrace && arguments.length > 0)
    {
        Error.stackTraceLimit = stackTraceLimit + 1;
        var location = (new Error("Stack trace")).stack;
        location = location.split('\n').splice(2)
                .map(s => '\t' + s.split(/[()]/)[1])
                .join('\n');

        if(stackTraceLimit == 1) {
            let argsString = Array.from(arguments).join(' ');
            let padding;
            if(argsString.length < printWidth)
                padding = new Array(printWidth - argsString.length).join(' ');
            else
                padding = ' ';

            console.log(argsString + padding + location);
        }
        else {
            console.log(...arguments);
            console.log(location);
        }
    }
    else
        console.log();
}
var JobType = {
    REPAIR: 0,
    CONSTRUCT: 1,
}
function Job(){
    this.id = -1;
    this.ticksElapsed = 0;
    this.finished = false;
    this.workers = [];
    this.num_workers = 0;
    this.required_creeps = 0;
    this.completion = undefined;
    this.type = -1;
    this.init = function(id, roomname, type, num_creeps, completion){
        this.id = id;
        this.type = type;
        this.roomname = roomname;
        this.required_creeps = num_creeps;
        this.completion = completion;
    };
}

function Queue() {
    var a = [], b = 0;
    this.getLength = function ()
    { return a.length - b };
    this.isEmpty = function ()
    { return 0 == a.length };
    this.enqueue = function (b) { a.push(b) };
    this.dequeue = function ()
    {
        if (0 != a.length)
        {
            var c = a[b]; 2 * ++b >= a.length && (a = a.slice(b), b = 0);
            return c;
        }
    };
    this.peek = function () { return 0 < a.length ? a[b] : void 0 }
}
function isDefense(structure){
    return structure.structureType == STRUCTURE_RAMPART || structure.structureType == STRUCTURE_WALL;
}

var utilities = {
    log: log,
    isDefense: isDefense,
    Queue: Queue,
    Job: Job,
    JobType: JobType,
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