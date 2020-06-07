var fs = require('fs');

var dir = fs.readdirSync('.');

for(let file of dir) {
	console.log(typeof file);
	let fileNameSplit = file.split(/[\.\{\}]/).filter(s => s != '');
	console.log(file);
	console.log(fileNameSplit);
	
	let newFileName = fileNameSplit[0] + (fileNameSplit.length > 1? ('.' + fileNameSplit[fileNameSplit.length -1]) : '');
	console.log(newFileName);
	fs.copyFileSync(file, newFileName);
}
