var AdmZip = require('adm-zip');

// creating archives
var zip = new AdmZip();

zip.addLocalFolder("./widgetlayout/","/widgetlayout/");
zip.addLocalFolder("./META-INF/", "/META-INF/");
zip.addLocalFolder("./dist/", "/dist/");
// add here all ng1 components/services 
//zip.addLocalFolder("./mycomponent/", "/mycomponent/");

zip.writeZip("svywidget.zip");