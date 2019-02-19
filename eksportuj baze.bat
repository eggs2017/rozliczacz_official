 mongodb\mongoexport --db ksiazka2_starter --collection rok --dbpath mongodb\data --out mongodb\data\rok.json
 mongodb\mongoexport --db ksiazka2_starter --collection miesiac --dbpath mongodb\data --out mongodb\data\miesiac.json
 mongodb\mongoexport --db ksiazka2_starter --collection wpis --dbpath mongodb\data --out mongodb\data\wpis.json
 mongodb\mongoexport --db ksiazka2_starter --collection wpis_schemat --dbpath mongodb\data --out mongodb\data\wpis_schemat.json

set SAVESTAMP=%DATE:/=-%@%TIME::=-%
set SAVESTAMP=%SAVESTAMP: =%.zip

 zip -r kopie_zapasowe/%SAVESTAMP% mongodb/data