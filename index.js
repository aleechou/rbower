var fs = require('fs') ;
var path = require('path') ;
var bower = require("bower") ;
var Config = require("bower-config") ;
var rimraf = require("rimraf") ;


function getAppdir(){
    var cwd = process.cwd() ;

    var res = /[\\\/]node_modules([\\\/]|$)/.exec(cwd) ;
    if(!res)
	return cwd ;
    else
	return cwd.substr(0,res.index+1) ;
}

exports.install = function(callback) {
    var appdir = getAppdir() ;
    console.log("Application dir:", appdir) ;

    var bowers = [] ;
    var bowerNames = {} ;

    var modulesdir = path.join(appdir,'node_modules') ;
    var filenames = fs.readdirSync(modulesdir) ;

    function scanBowerDep(modulename,dir) {

	if( !fs.statSync(dir).isDirectory() )
	    return ;

	var modjsonPath = path.join(dir,'bower.json') ;

	if( !fs.existsSync(modjsonPath) )
	    return ;

	var json = require(modjsonPath) ;
	if( !json.dependencies )
	    return ;

	console.log(modulename,"require bower components:") ;

	for(var name in json.dependencies){
	    console.log("  "+name+"#"+json.dependencies[name]) ;
	    bowers.push(name+"#"+json.dependencies[name]) ;
	    bowerNames[name] = name ;
	}
    }

    // 
    scanBowerDep('application',appdir) ;

    try{
	for(var i=0;i<filenames.length;i++){
	    var filena = filenames[i] ;

	    scanBowerDep(filena,path.join(modulesdir,filena)) ;
	}


	// 移除已有的版本
	var bowerdir = path.join(appdir,'bower_components') ;
	if( fs.existsSync(bowerdir) ){
	    for(var name in bowerNames){
		var installeddir = path.join(bowerdir,name) ;
		if( !fs.existsSync(installeddir) )
		    continue ;
		console.log('remove already installed component',name, '...') ;
		rimraf.sync(installeddir) ;
	    }
	}

    } catch(error) {
	callback && callback(error) ;
	return ;
    }

    console.log('start installing bower ') ;

    bower.commands.install(bowers,{},Config.read(appdir))
    	.on('end',function(installed){
	    callback && callback(null,installed) ;
	})
	.on('log',function(sth){
	    console.log(sth.id,sth.message) ;
	})
	.on('error',function(error){
	    callback && callback(error) ;
	}) ;
}



