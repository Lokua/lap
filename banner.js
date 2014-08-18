module.exports = 
'/**\n' +
' * <%= pkg.name %> - version <%= pkg.version %> ' +
'(built: <%= grunt.template.today("yyyy-mm-dd") %>)\n' +
' * <%= pkg.description %>\n' + 
' * <%= pkg.repository.url %>\n' + 
' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
' * Licensed under the <%= pkg.license.type %> license.\n' +
' * <%= pkg.license.url %>\n' +
' */\n';
