const { pick } = require('lodash');

// import Promise from "bluebird";
const { promisify } = require('util');
const fs = require('fs');
// const readFileAsync = promisify(fs.readFile)
// const writeFileAsync = promisify(fs.writeFile)
// const existsAsync = promisify(fs.exists)
// const path = require('path');
const fsp = require('fs').promises;
// const fsx = require('fs-extra');
const randomFile = require('select-random-file')
const _ = require('lodash');

// const randomLocation = require('random-location')
const randomLocationP = promisify(randomFile);

// const Geonames = require('geonames.js')

// const geonames = new Geonames({ username: 'boobo33', lan: 'en', encoding: 'JSON' });

function generateRandomInteger(min: number, max: number) {
  return Math.floor(min + Math.random()*(max + 1 - min))
}

/// hide in continent 

const hideInContinent = async (continent: any, number: number) => {
  for(let i = 0; i < number; i++) {
    const dir = `${__dirname}/states/${continent}`
    const pickedRandomFile = await randomLocationP(dir);
    console.log(`The random file is: ${pickedRandomFile}.`)
    const randomCountryData = await fsp.readFile(`${__dirname}/states/${continent}/${pickedRandomFile}`);
    const randomCountry = JSON.parse(randomCountryData)
    let randomState = undefined;

    if(randomCountry.geonames === undefined) throw("randomCountry.geonames is undefined")
    randomState = _.sample(randomCountry.geonames)
    if(randomState === undefined) throw("randomState is undefined")
    return randomState;
    // let randomState = _.sample(randomCountry.geonames)
    // if(randomState !== undefined) {
    //   console.log(randomState)
    //   // const radius = 100000
    //   // const randomStatePoint = {
    //   //   latitude: randomState.lat,
    //   //   longitude: randomState.lng
    //   // }      
    //   // const randomPoint = randomLocation.randomCirclePoint(randomStatePoint, radius)
    //   return randomState;
    // } 
  }
}

// hide world wide

const hideWorldWide = async (number: number) => {
  const continents = ['Africa', 'Antarctica', 'Europe', ,'Asia', 'North America', 'South America', 'United States']
  for(let i = 0; i < number; i++) {
    const randomContinent = _.sample(continents)
    if(randomContinent !== undefined) {
      const location = await hideInContinent(randomContinent, 1)
      return location;
    }
  }
}


export default hideWorldWide;


/// get data
//   try {
//     const citiesX = []
//       let countries = await geonames.countryInfo({})
//       countries.geonames.map( async (country) => {
//           let states = await geonames.children({geonameId: country.geonameId})
//            if(states.geonames) {
//               states.geonames.map(async (state) => {
//                 let cities = await geonames.children({geonameId: state.geonameId});
//                 console.log(cities)
//                 // if(cities.geonames) {
//                 //   cities.geonames.map(async (city) => {
//                 //     console.log(city.geonameId)
//                 //   })
//                 // }
//               })    
//            }
       
//       })
// } catch (err) {
//   console.error(err);
// }


// got states
  // const countriesData = await fsp.readFile(`./countries.json`);
  // const countries = JSON.parse(countriesData)
  // const countries = require('./countries')
  // console.log(countries)
  // countries.map(async (country) => {
  //   let states = await geonames.children({geonameId: country.geonameId})
  //   console.log(states)
  //   let data = JSON.stringify(states, null, 2);
  //   // await writeFileAsync(`${__dirname}/${country.continentName}/${country.countryName}.json`, data, { overwrite: true });
  //   await fsx.outputFile(`${__dirname}/${country.continentName}/${country.countryName}.json`, data, { overwrite: true });
  // })

  // get cities
//   try {

//   const files = await fsp.readdir(`${__dirname}/states/Europe`)
//     files.map(async (file, index) => {
//       const stateData = await fsp.readFile(`${__dirname}/states/Europe/${file}`);
//       const stateX = await JSON.parse(stateData)
//       if(stateX.geonames !== undefined) {
//         stateX.geonames.map(async (state) => {
//           let cities = await geonames.children({geonameId: state.geonameId});
//           console.log(cities)
//             let data = JSON.stringify(cities, null, 2);
//               await fsx.outputFile(`${__dirname}/cities/Europe/${state.countryName}/${state.adminName1}.json`, data, { overwrite: true });
//         })
//       }
//     })
// } catch (err) {
//   console.error(err);
// }

//   try {
//   // const continents = await geonames.search({q: 'CONT'}) //get continents
//   // console.log(continents)
//   // const countries = await geonames.countryInfo({})
//   // console.log(countries)
//   // let data = JSON.stringify(countries, null, 2);
//   // await writeFileAsync(`${__dirname}/countries.json`, data, { overwrite: true });

//   // const states = await geonames.children({geonameId: "3041565"})
//   // console.log(states)
//   //   let data = JSON.stringify(states, null, 2);
//   //   await writeFileAsync(`${__dirname}/states.json`, data, { overwrite: true });
//   // console.log(states)
//   // const regions = await geonames.children({geonameId: "7521313"});
//   // console.log(regions)
//   // const cities = await geonames.children({geonameId: regions.geonames[0].geonameId});
//   // console.log(cities)
// } catch (err) {
//   console.error(err);
// }