/**
 * Add companies WITH LinkedIn URLs to Top-Temp Workspace
 * Extracts companies with LinkedIn URLs from all 4 CSV files and adds/updates them
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Configuration
const WORKSPACE_SLUG = 'top-temp';
const placeholders = ['Not found', 'N/A', 'n/a', 'NA', 'na', 'None', 'none', 'NONE'];

// Companies with LinkedIn URLs extracted from the files
// File 1 data
const file1Data = [
  { name: "5Bars Services", website: "https://5bars.net", linkedin: "https://www.linkedin.com/company/5-bars-services-llc" },
  { name: "ACRS Telecommunications Engineers", website: "https://acrsokc.com", linkedin: "https://www.linkedin.com/company/acrs-2000-corp" },
  { name: "ADCOMM Engineering, LLC", website: "https://adcomm911.com", linkedin: "https://www.linkedin.com/company/adcommeng" },
  { name: "AMC Optics", website: "https://amc-optics.com", linkedin: "https://www.linkedin.com/company/approved-memory" },
  { name: "AMSYS Group", website: "https://amsysis.com", linkedin: "https://www.linkedin.com/company/amsys-group" },
  { name: "APPROVE", website: "https://approvepayments.com", linkedin: "https://www.linkedin.com/company/approvepayments" },
  { name: "Airway Technologies", website: "https://airway.com", linkedin: "https://www.linkedin.com/company/airway-technologies" },
  { name: "American Power Systems", website: "https://ampowersys.com", linkedin: "https://www.linkedin.com/company/american-power-systems-llc" },
  { name: "Ants-technology", website: "https://ants-technology.com", linkedin: "https://www.linkedin.com/company/ants-technology-inc" },
  { name: "ArchComm", website: "https://archcomm.net", linkedin: "https://www.linkedin.com/company/archcomm-inc.-architects" },
  { name: "Atlas Design Services", website: "https://atlasdgn.com", linkedin: "https://www.linkedin.com/company/atlas-design-services-austin" },
  { name: "BTC Broadband", website: "https://mybtc.com", linkedin: "https://www.linkedin.com/company/btc-broadband" },
  { name: "BTEL - Brazoria Telephone Co", website: "https://btel.com", linkedin: "https://www.linkedin.com/company/brazoria-telephone-co" },
  { name: "Bartlett Electric Cooperative, Inc.", website: "https://bartlettec.coop", linkedin: "https://www.linkedin.com/company/bartlett-electric-cooperative-inc" },
  { name: "Battery Store Inc.", website: "https://batterystore.com", linkedin: "https://www.linkedin.com/company/battery-store" },
  { name: "Berkeley Electric Cooperative, Inc.", website: "https://bec.coop", linkedin: "https://www.linkedin.com/company/berkeley-electric-cooperative-inc-" },
  { name: "Blue Ridge Electric Co-op", website: "https://blueridge.coop", linkedin: "https://www.linkedin.com/company/blue-ridge-electric-cooperative" },
  { name: "Blue Ridge Electric Membership Corporation", website: "https://blueridgeenergy.com", linkedin: "https://www.linkedin.com/company/blueridgeenergy" },
  { name: "Btel", website: "https://btel.com", linkedin: "https://www.linkedin.com/company/brazoria-telephone-co" },
  { name: "CDL Group of Companies", website: "https://cdl-electric.com", linkedin: "https://www.linkedin.com/company/cdlgroupofcompanies" },
  { name: "Cablcon", website: "https://cablcon.com", linkedin: "https://www.linkedin.com/company/cablcon" },
  { name: "Cablcon | IEWC.com", website: "https://cablcon.com", linkedin: "https://www.linkedin.com/company/cablcon" },
  { name: "Cable and Connections", website: "https://cableandconnections.com", linkedin: "https://www.linkedin.com/company/cable-and-connections-inc" },
  { name: "Cenmex", website: "https://cenmex.com", linkedin: "https://www.linkedin.com/company/centrifugados-mexicanos-s-a-de-c-v-" },
  { name: "Central New Mexico Electric Cooperative", website: "https://cnmec.org", linkedin: "https://www.linkedin.com/company/central-new-mexico-electric-cooperative-inc." },
  { name: "Central Texas Telephone Cooperative, Inc.", website: "https://centexnet.com", linkedin: "https://www.linkedin.com/company/central-texas-telephone-cooperative-inc-" },
  { name: "Centric Fiber", website: "https://centric-us.com", linkedin: "https://www.linkedin.com/company/centric-fiber" },
  { name: "Century Wire Products Corp", website: "https://phoenixutility.com", linkedin: "https://www.linkedin.com/company/century-wire-products-corp" },
  { name: "Champion Precast", website: "https://championprecast.com", linkedin: "https://www.linkedin.com/company/champion-precast-inc" },
  { name: "Chelan County Public Utility District No. 1", website: "https://chelanpud.org", linkedin: "https://www.linkedin.com/company/chelan-county-pud" },
  { name: "Chelan County Public Utility District No. 2", website: "https://chelanpud.org", linkedin: "https://www.linkedin.com/company/chelan-county-pud" },
  { name: "Cielo Systems", website: "https://cielosystems.net", linkedin: "https://www.linkedin.com/company/cielo-systems-international" },
  { name: "CimTel", website: "https://mbo.one", linkedin: "https://www.linkedin.com/company/cimarron-telephone" },
  { name: "City of Columbia", website: "", linkedin: "https://www.linkedin.com/company/city-of-columbia-missouri" },
  { name: "City of Georgetown", website: "https://georgetown.org", linkedin: "https://www.linkedin.com/company/city-of-georgetown" },
  { name: "City of Mobile", website: "", linkedin: "https://www.linkedin.com/company/city-of-mobile-al" },
  { name: "Cleco Corporate Holdings LLC", website: "https://cleco.com", linkedin: "https://www.linkedin.com/company/cleco" },
  { name: "Cleco Power LLC", website: "https://cleco.com", linkedin: "https://www.linkedin.com/company/cleco" },
  { name: "Cleveland Utilities Authority", website: "https://clevelandutilities.com", linkedin: "https://www.linkedin.com/company/cleveland-utilities" },
  { name: "Coastal Electric Membership Corporation", website: "https://coastalemc.com", linkedin: "https://www.linkedin.com/company/coastal-electric-cooperative" },
  { name: "Cobb Electric Membership Corporation", website: "https://cobbemc.com", linkedin: "https://www.linkedin.com/company/cobb-emc" },
  { name: "Colquitt Electric Membership Corporation", website: "https://colquittemc.com", linkedin: "https://www.linkedin.com/company/colquitt-electric-membership" },
  { name: "Columbia Water & Light", website: "https://como.gov", linkedin: "https://www.linkedin.com/company/city-of-columbia-missouri" },
  { name: "Consumers Power Inc.", website: "https://cpi.coop", linkedin: "https://www.linkedin.com/company/consumers-power-inc-" },
  { name: "Corn Belt Power Cooperative", website: "https://cbpower.coop", linkedin: "https://www.linkedin.com/company/corn-belt-power-cooperative" },
  { name: "Covington Electric Cooperative, Inc.", website: "https://covington.coop", linkedin: "https://www.linkedin.com/company/covington-electric-cooperative-inc-" },
  { name: "Coweta-Fayette Electric Membership Corporation", website: "https://utility.org", linkedin: "https://www.linkedin.com/company/coweta-fayette-emc" },
  { name: "Cross Telephone Company, LLC", website: "https://mbo.one", linkedin: "https://www.linkedin.com/company/cross-family-of-companies" },
  { name: "Dakota Utility Conractors", website: "https://dakotautility.com", linkedin: "https://www.linkedin.com/company/dakota-utility-contractors-inc-" },
  { name: "Data Comm for Business, Inc.", website: "https://dcbnet.com", linkedin: "https://www.linkedin.com/company/data-comm-for-business-dcb-" },
  { name: "Dell Telephone Cooperative", website: "https://delltelco.com", linkedin: "https://www.linkedin.com/company/dell-telephone-cooperative" }
];

// File 2 data (already processed, but including for completeness)
const file2Data = [
  { name: "Digital Plus Solutions, LLC", website: "https://digitalplussolutions.com", linkedin: "https://www.linkedin.com/company/digitalplussolutions1" },
  { name: "Direct Source Equipment", website: "https://gmail.com", linkedin: "https://www.linkedin.com/company/direct-source-equipment" },
  { name: "Ditch Witch of Houston", website: "https://dwhouston.com", linkedin: "https://www.linkedin.com/company/ditch-witch-houston" },
  { name: "Domestic Power USA", website: "https://domesticpower.us", linkedin: "https://www.linkedin.com/company/domesticpower" },
  { name: "EDX Wireless", website: "https://edx.com", linkedin: "https://www.linkedin.com/company/edx-wireless" },
  { name: "ELGi", website: "https://elgi.com", linkedin: "https://www.linkedin.com/company/elginorthamerica" },
  { name: "East Columbia Basin Irrigation District", website: "https://ecbid.org", linkedin: "https://www.linkedin.com/company/ecbid" },
  { name: "East River Electric Power Cooperative", website: "https://eastriver.coop", linkedin: "https://www.linkedin.com/company/east-river-electric-power-cooperative-inc." },
  { name: "Eastex Telephone Cooperative, Inc.", website: "https://eastex.com", linkedin: "https://www.linkedin.com/company/eastex-telephone-cooperative" },
  { name: "Eastwind Communications", website: "https://eastwindcom.com", linkedin: "https://www.linkedin.com/company/eastwindcommunications" },
  { name: "Easy Street Systems", website: "https://easystreetsystems.com", linkedin: "https://www.linkedin.com/company/easystreet-systems" },
  { name: "El Dorado Irrigation District", website: "", linkedin: "https://www.linkedin.com/company/el-dorado-irrigation-district" },
  { name: "Electric Consultants, Inc.", website: "https://eciblgs.com", linkedin: "https://www.linkedin.com/company/electrical-consultants-inc." },
  { name: "Escambia River Electric Cooperative", website: "https://erec.com", linkedin: "https://www.linkedin.com/company/escambia-river-electric-cooperative-inc-" },
  { name: "Ewing-Foley", website: "https://ewingfoley.com", linkedin: "https://www.linkedin.com/company/ewing-foley" },
  { name: "Expanse Electrical", website: "https://expanseelectrical.com", linkedin: "https://www.linkedin.com/company/expanse-electrical-co" },
  { name: "Expanse Electrical Co.", website: "https://expanseelectrical.com", linkedin: "https://www.linkedin.com/company/expanse-electrical-co" },
  { name: "Ferreira Power South", website: "https://ferreirapowersouth.com", linkedin: "https://www.linkedin.com/company/ferreira-construction-co-inc-" },
  { name: "Five Area Telephone Cooperative, Inc.", website: "https://fivearea.com", linkedin: "https://www.linkedin.com/company/five-area-telephone-cooperative-inc" },
  { name: "Forsk", website: "https://forsk.com", linkedin: "https://www.linkedin.com/company/forsk" },
  { name: "Garland Light & Power Company", website: "https://garlandpower.com", linkedin: "https://www.linkedin.com/company/garland-light-power" },
  { name: "Georgia System Operations Corp.", website: "https://gasoc.com", linkedin: "https://www.linkedin.com/company/georgia-system-operations-corporation" },
  { name: "Georgia System Operations Corporation", website: "https://gasoc.com", linkedin: "https://www.linkedin.com/company/georgia-system-operations-corporation" },
  { name: "Gibson Electric Membership Corporation", website: "https://gibsonemc.com", linkedin: "https://www.linkedin.com/company/gibson-electric-membership-corporation" },
  { name: "Gillespie, Prudhon & Associates", website: "https://gpatelecom.com", linkedin: "https://www.linkedin.com/company/gillespie-prudhon-associates" },
  { name: "Gunnison County Electric Association", website: "", linkedin: "https://www.linkedin.com/company/gunnison-county-electric-association" },
  { name: "HCI Energy", website: "https://hcienergy.com", linkedin: "https://www.linkedin.com/company/hci-energy-llc" },
  { name: "HCTC", website: "https://hctc.coop", linkedin: "https://www.linkedin.com/company/hill-country-telephone-cooperative-inc" },
  { name: "HP Communications", website: "https://hpcomminc.com", linkedin: "https://www.linkedin.com/company/hp-communications-inc" },
  { name: "HR Green, Inc", website: "https://hrgreen.com", linkedin: "https://www.linkedin.com/company/hr-green-inc-" },
  { name: "Habersham EMC", website: "https://hemc.coop", linkedin: "https://www.linkedin.com/company/habersham-electric-membership-corporation" },
  { name: "Halff", website: "https://halff.com", linkedin: "https://www.linkedin.com/company/halff-associates" },
  { name: "Hart Electric Membership Corporation", website: "https://hartemc.com", linkedin: "https://www.linkedin.com/company/hart-electric-membership-corporation" },
  { name: "High Country Fusion", website: "https://highcountryfusion.com", linkedin: "https://www.linkedin.com/company/high-country-fusion" },
  { name: "Hill Country Telephone Cooperative", website: "https://hctc.coop", linkedin: "https://www.linkedin.com/company/hill-country-telephone-cooperative-inc" },
  { name: "Holston Electric Cooperative", website: "https://holstonelectric.com", linkedin: "https://www.linkedin.com/company/holston-electric-cooperative" },
  { name: "ITG Communications LLC", website: "https://i-t-g.net", linkedin: "https://www.linkedin.com/company/itg-communications-llc" },
  { name: "Jameson Tools", website: "https://jamesontools.com", linkedin: "https://www.linkedin.com/company/jameson-llc" }
];

// File 3 data
const file3Data = [
  { name: "KCK Board of Public Utilities", website: "https://bpu.com", linkedin: "https://www.linkedin.com/company/kckbpu" },
  { name: "Kramer Service Group", website: "https://kramerservicegroup.com", linkedin: "https://www.linkedin.com/company/kramer-service-group" },
  { name: "LTS Managed Technical Services, LLC", website: "https://ledcor.com", linkedin: "https://www.linkedin.com/company/lts-technical-services" },
  { name: "LiteLinx", website: "https://litelinx.io", linkedin: "https://www.linkedin.com/company/litelinx" },
  { name: "Lonestar Precast", website: "https://lsprecast.com", linkedin: "https://www.linkedin.com/company/lonestar-prestress-mfg.-inc." },
  { name: "M & A Electric Power Cooperative", website: "https://maelectric.com", linkedin: "https://www.linkedin.com/company/m-a-electric-power-cooperative" },
  { name: "Marla Newman / Plummer Associates, Inc.", website: "https://plummer.com", linkedin: "https://www.linkedin.com/company/plummer-associates-inc" },
  { name: "Mears Broadband LLC", website: "https://mearsbroadband.com", linkedin: "https://www.linkedin.com/company/mears-broadband" },
  { name: "Meeker Cooperative Light & Power Association", website: "https://meeker.coop", linkedin: "https://www.linkedin.com/company/meekerenergy" },
  { name: "Micronet Communications, Inc.", website: "https://micronetcom.com", linkedin: "https://www.linkedin.com/company/micronet-communications-inc-" },
  { name: "Mitchell Electric Membership", website: "https://mitchellemc.com", linkedin: "https://www.linkedin.com/company/mitchell-electric-membership" },
  { name: "Monte R. Lee & Company", website: "https://mrleng.com", linkedin: "https://www.linkedin.com/company/monte-r.-lee-and-company" },
  { name: "Mountain Parks Electric Inc.", website: "", linkedin: "https://www.linkedin.com/company/mountain-parks-electric-inc." },
  { name: "Musashi Energy Solutions", website: "https://gmail.com", linkedin: "https://www.linkedin.com/company/musashi-energy-solutions" },
  { name: "NAMS Firefly", website: "https://nams.net", linkedin: "https://www.linkedin.com/company/carrier-management-services-inc." },
  { name: "NTest, Inc.", website: "https://ntestinc.com", linkedin: "https://www.linkedin.com/company/ntestfms" },
  { name: "NW Electric Power Cooperative", website: "https://nwepc.com", linkedin: "https://www.linkedin.com/company/northwest-iowa-power-cooperative" },
  { name: "NWS Wireless", website: "https://nwsnext.com", linkedin: "https://www.linkedin.com/company/nwsnext" },
  { name: "Navopache Electric Cooperative, Inc.", website: "https://navopache.org", linkedin: "https://www.linkedin.com/company/navopache-electric-cooperative" },
  { name: "Nevada NV", website: "https://nvenergy.com", linkedin: "https://www.linkedin.com/company/nv-energy" },
  { name: "OPTK Networks", website: "https://optk.com", linkedin: "https://www.linkedin.com/company/optknetworks-" },
  { name: "Olmec", website: "https://gmail.com", linkedin: "https://www.linkedin.com/company/olmecsystems" },
  { name: "OmniCable", website: "https://gmail.com", linkedin: "https://www.linkedin.com/company/omni-cable" },
  { name: "PPC Belden", website: "https://belden.com", linkedin: "https://www.linkedin.com/company/ppc_2" },
  { name: "PVT", website: "https://pvt.com", linkedin: "https://www.linkedin.com/company/pe%C3%B1asco-valley-telephone-cooperative-inc-" },
  { name: "Pathwayz Communications", website: "https://pathwayz.com", linkedin: "https://www.linkedin.com/company/pathwayz-communications-inc" },
  { name: "Peace River Electric Cooperative", website: "https://preco.coop", linkedin: "https://www.linkedin.com/company/peace-river-electric-cooperative-inc" },
  { name: "PeakNet", website: "https://peaknet.com", linkedin: "https://www.linkedin.com/company/peaknet-llc" },
  { name: "Pecan Creek Construction", website: "", linkedin: "https://www.linkedin.com/company/pecan-creek-construction" },
  { name: "Pelican Broadband", website: "https://pelicanbb.com", linkedin: "https://www.linkedin.com/company/pelicanbb" },
  { name: "Penasco Valley Telephone", website: "https://pvt.com", linkedin: "https://www.linkedin.com/company/pe%C3%B1asco-valley-telephone-cooperative-inc-" },
  { name: "Planters Electric Membership Corporation", website: "https://plantersemc.com", linkedin: "https://www.linkedin.com/company/planters-electric-membership" },
  { name: "Plateau", website: "https://plateautel.com", linkedin: "https://www.linkedin.com/company/plateautel" },
  { name: "Plateau Telecommunications", website: "https://plateautel.com", linkedin: "https://www.linkedin.com/company/plateautel" },
  { name: "Plummer", website: "https://plummer.com", linkedin: "https://www.linkedin.com/company/plummer-associates-inc" },
  { name: "Plummer Associates, Inc.", website: "https://plummer.com", linkedin: "https://www.linkedin.com/company/plummer-associates-inc" },
  { name: "Poka Lambro", website: "https://teampoka.com", linkedin: "https://www.linkedin.com/company/poka-lambro-telephone-co" },
  { name: "Power Storage Solutions", website: "https://pwrss1.com", linkedin: "https://www.linkedin.com/company/power-storage-solutions" },
  { name: "Power-Tel Utility Products Inc", website: "https://ptupcorp.com", linkedin: "https://www.linkedin.com/company/power-tel-utility-products-inc" },
  { name: "Premier Truck Rental", website: "https://rentptr.com", linkedin: "https://www.linkedin.com/company/premier-truck-rental" },
  { name: "RAD", website: "https://rad.com", linkedin: "https://www.linkedin.com/company/rad-data-communications" },
  { name: "Rockport Contracting", website: "https://rockport.net", linkedin: "https://www.linkedin.com/company/rockportfiber" },
  { name: "Rockwell Tech", website: "https://gbohtecnology.com", linkedin: "https://www.linkedin.com/company/rockwelltech" },
  { name: "Rohn Products, LLC", website: "https://rohntower.com", linkedin: "https://www.linkedin.com/company/rohn-products-llc" },
  { name: "Root Brothers Mfg and Supply", website: "https://rootbrothers.com", linkedin: "https://www.linkedin.com/company/root-brothers-mfg-&-supply-co" }
];

// File 4 data
const file4Data = [
  { name: "Schneider Engineering", website: "https://se-texas.com", linkedin: "https://www.linkedin.com/company/schneider-engineering-consulting" },
  { name: "Seattle City Light", website: "https://seattle.gov", linkedin: "https://www.linkedin.com/company/seattle-city-light" },
  { name: "Selrico Communications", website: "https://selricocomm.com", linkedin: "https://www.linkedin.com/company/selrico-communications" },
  { name: "Sho-Me Power Electric Cooperative", website: "https://shomepower.com", linkedin: "https://www.linkedin.com/company/sho-me-power-electric-cooperative" },
  { name: "Snapping Shoals Electric Membership Corporation", website: "https://ssemc.com", linkedin: "https://www.linkedin.com/company/snapping-shoals-electric-membership-corporation" },
  { name: "Snohomish County Public Utility District No. 1", website: "https://snopud.com", linkedin: "https://www.linkedin.com/company/snohomish-county-pud" },
  { name: "Source Power", website: "https://sourcepowerllc.com", linkedin: "https://www.linkedin.com/company/source-power-llc" },
  { name: "South Alabama Electric Cooperative", website: "https://southaec.com", linkedin: "https://www.linkedin.com/company/south-alabama-electric-cooperative" },
  { name: "Southern California Edison", website: "https://sce.com", linkedin: "https://www.linkedin.com/company/sce" },
  { name: "Southern California Edison Company", website: "https://sce.com", linkedin: "https://www.linkedin.com/company/sce" },
  { name: "Southern Nevada Water Agency/Las Vegas Valley Water District", website: "https://lvvwd.com", linkedin: "https://www.linkedin.com/company/lvvwd" },
  { name: "Southern Rivers Energy", website: "https://srivers.net", linkedin: "https://www.linkedin.com/company/southernriversenergy" },
  { name: "Southwest Gas Corporation", website: "https://swgas.com", linkedin: "https://www.linkedin.com/company/southwest-gas-corporation" },
  { name: "Southwest Texas Communications", website: "https://swtexas.com", linkedin: "https://www.linkedin.com/company/southwest-texas-telephone-company" },
  { name: "Splicers, Inc", website: "https://splicersinc.com", linkedin: "https://www.linkedin.com/company/splicers-inc" },
  { name: "StruXur Team", website: "https://struxurteam.com", linkedin: "https://www.linkedin.com/company/struxur-team" },
  { name: "Syntrio Solutions", website: "https://syntrio.net", linkedin: "https://www.linkedin.com/company/syntrio" },
  { name: "TCS Communications", website: "https://tcscomm.com", linkedin: "https://www.linkedin.com/company/tcs-communications" },
  { name: "TOP Engineers Plus PLLC", website: "https://gmail.com", linkedin: "https://www.linkedin.com/company/top-engineers-plus-pllc" },
  { name: "Tacoma Power - Utility Technology Services", website: "https://cityoftacoma.org", linkedin: "https://www.linkedin.com/company/tacoma-power" },
  { name: "Techline Inc.", website: "https://techline-inc.com", linkedin: "https://www.linkedin.com/company/techlineinc" },
  { name: "Telcon Services", website: "https://telconservices.com", linkedin: "https://www.linkedin.com/company/telcon-services-llc" },
  { name: "Telecom America Services, Inc.", website: "https://ykc.com", linkedin: "https://www.linkedin.com/company/telecom-america-services-inc-" },
  { name: "Texas Electric Cooperatives", website: "https://texas-ec.org", linkedin: "https://www.linkedin.com/company/texas-electric-cooperatives" },
  { name: "The Periti Group", website: "https://theperitigroup.com", linkedin: "https://www.linkedin.com/company/the-periti-group-llc" },
  { name: "Trident Solutions", website: "https://tridentsolutions.com", linkedin: "https://www.linkedin.com/company/trident-solutions" },
  { name: "Triumph Cabling Systems", website: "https://triumph-cs.com", linkedin: "https://www.linkedin.com/company/triumph-cabling-systems" },
  { name: "Tycon Systems", website: "https://tyconsystems.com", linkedin: "https://www.linkedin.com/company/tycon-systems-inc-" },
  { name: "USA Digital Communications", website: "https://usad.com", linkedin: "https://www.linkedin.com/company/usa-digital" },
  { name: "Ubiik Mimomax", website: "https://ubiik.com", linkedin: "https://www.linkedin.com/company/ubiikmimomax" },
  { name: "United Technologies Services, Inc.", website: "https://utechserviceinc.com", linkedin: "https://www.linkedin.com/company/united-technology-service" },
  { name: "Utilities Board of the City of Andalusia", website: "https://cityofandalusia.com", linkedin: "https://www.linkedin.com/company/andalusiaalgov" },
  { name: "Utility Plastucs", website: "https://sbcglobal.net", linkedin: "https://www.linkedin.com/company/utility-plastics" },
  { name: "Vetcore Technology", website: "https://vetcoretech.com", linkedin: "https://www.linkedin.com/company/vetcore-technology-llc" },
  { name: "WKW Associates", website: "https://wkwassociates.com", linkedin: "https://www.linkedin.com/company/wkw-associates-llc" },
  { name: "Washoe County Utilities Division", website: "https://washoecounty.gov", linkedin: "https://www.linkedin.com/company/washoe-county-state-of-nevada" },
  { name: "Wells Rural Electric Company", website: "https://wrec.coop", linkedin: "https://www.linkedin.com/company/wells-rural-electric-company" },
  { name: "Wes-Tex Telephone Cooperative, Inc.", website: "https://westex.coop", linkedin: "https://www.linkedin.com/company/wes-tex-telephone-co-op" },
  { name: "Westermo Data Communications, Inc.", website: "https://westermo.com", linkedin: "https://www.linkedin.com/company/westermo" },
  { name: "Whaley Communications, Inc.", website: "https://whaleycomm.com", linkedin: "https://www.linkedin.com/company/whaley-communications-inc" },
  { name: "White River Electric Association", website: "", linkedin: "https://www.linkedin.com/company/white-river-electric-association-inc." },
  { name: "XIT RURAL TELEPHONE", website: "https://xitcomm.net", linkedin: "https://www.linkedin.com/company/xit-communications" },
  { name: "XpressConnect Supply", website: "https://xpressconnect.com", linkedin: "https://www.linkedin.com/company/xpressconnect-supply" },
  { name: "YUBA Water Agency", website: "https://yubawater.org", linkedin: "https://www.linkedin.com/company/yubawater" },
  { name: "Yuba County Water Agency", website: "", linkedin: "https://www.linkedin.com/company/yubawater" },
  { name: "al watan", website: "https://outlook.com", linkedin: "https://www.linkedin.com/company/al-watan-tv---newspaper" }
];

// Combine all data and remove duplicates
const allCompanies = [...file1Data, ...file2Data, ...file3Data, ...file4Data];
const uniqueCompanies = [];
const seenNames = new Set();

allCompanies.forEach(company => {
  const normalizedName = company.name.toLowerCase();
  if (!seenNames.has(normalizedName)) {
    seenNames.add(normalizedName);
    uniqueCompanies.push(company);
  }
});

async function addCompaniesToWorkspace() {
  try {
    console.log('🚀 Adding companies WITH LinkedIn URLs to Top-Temp workspace\n');
    console.log('='.repeat(60));

    // Step 1: Get workspace
    console.log('\n🏢 Getting workspace...');
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
    console.log(`📊 Processing ${uniqueCompanies.length} unique companies with LinkedIn URLs\n`);

    // Step 2: Process companies
    console.log('🏢 Processing companies...\n');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const companyData of uniqueCompanies) {
      try {
        const { name: companyName, website, linkedin: linkedinUrl } = companyData;

        // Check if company already exists
        let company = await prisma.companies.findFirst({
          where: {
            workspaceId: workspace.id,
            name: {
              equals: companyName,
              mode: 'insensitive'
            },
            deletedAt: null
          }
        });

        if (company) {
          // Update existing company
          const updateData = {
            updatedAt: new Date()
          };

          if (website && !company.website) {
            updateData.website = website;
          }

          if (linkedinUrl && !company.linkedinUrl) {
            updateData.linkedinUrl = linkedinUrl;
          } else if (linkedinUrl && company.linkedinUrl !== linkedinUrl) {
            // Update even if different (use the new one)
            updateData.linkedinUrl = linkedinUrl;
          }

          // Only update if there's something to update
          if (Object.keys(updateData).length > 1) {
            await prisma.companies.update({
              where: { id: company.id },
              data: updateData
            });
            updated++;
            if (updated <= 20) {
              console.log(`   🔄 Updated: ${companyName}`);
            }
          } else {
            skipped++;
          }
        } else {
          // Create new company
          company = await prisma.companies.create({
            data: {
              id: ulid(),
              name: companyName,
              website: website || null,
              linkedinUrl: linkedinUrl,
              workspaceId: workspace.id,
              status: 'LEAD',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          created++;
          if (created <= 20) {
            console.log(`   ✅ Created: ${companyName}`);
          }
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${companyData.name}:`, error.message);
        errors++;
      }
    }

    if (created > 20) console.log(`   ... and ${created - 20} more created`);
    if (updated > 20) console.log(`   ... and ${updated - 20} more updated`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`Total companies with LinkedIn: ${uniqueCompanies.length}`);
    console.log(`Companies created: ${created}`);
    console.log(`Companies updated: ${updated}`);
    console.log(`Companies skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log('='.repeat(60));
    console.log('✅ Process complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addCompaniesToWorkspace()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = addCompaniesToWorkspace;

