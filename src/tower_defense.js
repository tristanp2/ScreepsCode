var tower_defense = {
    run: function(tower){
        console.log('tower defense');
        if(!tower.memory.target_id){
            console.log('finding target');
            var hostiles = tower.room.find(FIND_HOSTILE_CREEPS);
            if(hostiles.length < 1)
                return;
            else{
                tower.memory.target_id = hostiles[0].id;
            }
        }
        else{
            console.log('targeting');
            var target = Game.getObjectById(tower.memory.target_id);
            if(target && target.hits > 0){
                tower.attack(target);
            }
            else{
                tower.memory.target_id = 0;
            }
        }
    }
}
module.exports = tower_defense;