/**
 * ~10 technicians per trade, mixed junior → expert.
 * Login for every technician: staff123
 */
export const TECHNICIAN_ROSTER = [
  // Electrical — lighting, fans, wiring, street lights
  { name: "Gopal R", email: "gopal.r@bitsathy.ac.in", department: "Electrical", phone: "99429 21301", specialty: "ELECTRICIAN", experienceYears: 1 },
  { name: "Vignesh E", email: "vignesh.e@bitsathy.ac.in", department: "Electrical", phone: "99429 21302", specialty: "ELECTRICIAN", experienceYears: 2 },
  { name: "Senthil K", email: "senthil.k@bitsathy.ac.in", department: "Electrical", phone: "99429 21231", specialty: "ELECTRICIAN", experienceYears: 4 },
  { name: "Dinesh K", email: "dinesh.k@bitsathy.ac.in", department: "Electrical", phone: "99429 21303", specialty: "ELECTRICIAN", experienceYears: 5 },
  { name: "Kalpana E", email: "kalpana.e@bitsathy.ac.in", department: "Electrical", phone: "99429 21304", specialty: "ELECTRICIAN", experienceYears: 6 },
  { name: "Saravanan E", email: "saravanan.e@bitsathy.ac.in", department: "Electrical", phone: "99429 21305", specialty: "ELECTRICIAN", experienceYears: 8 },
  { name: "Mohan E", email: "mohan.e@bitsathy.ac.in", department: "Electrical", phone: "99429 21306", specialty: "ELECTRICIAN", experienceYears: 10 },
  { name: "Ramesh M", email: "ramesh.m@bitsathy.ac.in", department: "Electrical", phone: "99429 21201", specialty: "ELECTRICIAN", experienceYears: 14 },
  { name: "Palanisamy E", email: "palanisamy.e@bitsathy.ac.in", department: "Electrical", phone: "99429 21307", specialty: "ELECTRICIAN", experienceYears: 16 },
  { name: "Thangavel E", email: "thangavel.e@bitsathy.ac.in", department: "Electrical", phone: "99429 21308", specialty: "ELECTRICIAN", experienceYears: 18 },

  // IT / Wi-Fi / network
  { name: "Harish B", email: "harish.b@bitsathy.ac.in", department: "IT Infrastructure", phone: "99429 21233", specialty: "NETWORK", experienceYears: 2 },
  { name: "Keerthana N", email: "keerthana.n@bitsathy.ac.in", department: "IT Infrastructure", phone: "99429 21311", specialty: "NETWORK", experienceYears: 1 },
  { name: "Pradeep N", email: "pradeep.n@bitsathy.ac.in", department: "IT Infrastructure", phone: "99429 21312", specialty: "NETWORK", experienceYears: 3 },
  { name: "Anitha N", email: "anitha.n@bitsathy.ac.in", department: "IT Infrastructure", phone: "99429 21313", specialty: "NETWORK", experienceYears: 4 },
  { name: "Vijay N", email: "vijay.n@bitsathy.ac.in", department: "IT Infrastructure", phone: "99429 21314", specialty: "NETWORK", experienceYears: 6 },
  { name: "Nisha V", email: "nisha.v@bitsathy.ac.in", department: "IT Infrastructure", phone: "99429 21203", specialty: "NETWORK", experienceYears: 9 },
  { name: "Sathish N", email: "sathish.n@bitsathy.ac.in", department: "IT Infrastructure", phone: "99429 21315", specialty: "NETWORK", experienceYears: 8 },
  { name: "Revathy N", email: "revathy.n@bitsathy.ac.in", department: "IT Infrastructure", phone: "99429 21316", specialty: "NETWORK", experienceYears: 11 },
  { name: "Karthikeyan N", email: "karthikeyan.n@bitsathy.ac.in", department: "IT Infrastructure", phone: "99429 21317", specialty: "NETWORK", experienceYears: 14 },
  { name: "Balaji N", email: "balaji.n@bitsathy.ac.in", department: "IT Infrastructure", phone: "99429 21318", specialty: "NETWORK", experienceYears: 17 },

  // Water / plumbing (campus)
  { name: "Prabhu P", email: "prabhu.p@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21321", specialty: "PLUMBER", experienceYears: 1 },
  { name: "Kumar P", email: "kumar.p@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21322", specialty: "PLUMBER", experienceYears: 2 },
  { name: "Shanthi P", email: "shanthi.p@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21323", specialty: "PLUMBER", experienceYears: 3 },
  { name: "Raja P", email: "raja.p@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21324", specialty: "PLUMBER", experienceYears: 5 },
  { name: "Mahesh P", email: "mahesh.p@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21325", specialty: "PLUMBER", experienceYears: 6 },
  { name: "Balamurugan T", email: "balamurugan.t@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21234", specialty: "PLUMBER", experienceYears: 8 },
  { name: "Selvam P", email: "selvam.p@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21326", specialty: "PLUMBER", experienceYears: 10 },
  { name: "Poornima P", email: "poornima.p@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21327", specialty: "PLUMBER", experienceYears: 12 },
  { name: "Natarajan P", email: "natarajan.p@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21328", specialty: "PLUMBER", experienceYears: 15 },
  { name: "Chinnasamy P", email: "chinnasamy.p@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21329", specialty: "PLUMBER", experienceYears: 18 },

  // Civil / furniture / classroom infrastructure
  { name: "Ajith C", email: "ajith.c@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21331", specialty: "CIVIL", experienceYears: 1 },
  { name: "Deepa C", email: "deepa.c@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21332", specialty: "CIVIL", experienceYears: 2 },
  { name: "Suresh C", email: "suresh.c@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21333", specialty: "CIVIL", experienceYears: 4 },
  { name: "Lakshmi C", email: "lakshmi.c@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21334", specialty: "CIVIL", experienceYears: 5 },
  { name: "Ganesh C", email: "ganesh.c@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21335", specialty: "CIVIL", experienceYears: 7 },
  { name: "Arun P", email: "arun.p@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21202", specialty: "CIVIL", experienceYears: 11 },
  { name: "Kannan C", email: "kannan.c@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21336", specialty: "CIVIL", experienceYears: 9 },
  { name: "Meenakshi C", email: "meenakshi.c@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21337", specialty: "CIVIL", experienceYears: 13 },
  { name: "Ravi C", email: "ravi.c@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21338", specialty: "CIVIL", experienceYears: 16 },
  { name: "Perumal C", email: "perumal.c@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21339", specialty: "CIVIL", experienceYears: 19 },

  // HVAC / AC
  { name: "Naveen H", email: "naveen.h@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21341", specialty: "HVAC", experienceYears: 1 },
  { name: "Swathi H", email: "swathi.h@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21342", specialty: "HVAC", experienceYears: 2 },
  { name: "Aravind H", email: "aravind.h@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21343", specialty: "HVAC", experienceYears: 4 },
  { name: "Mani C", email: "mani.c@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21235", specialty: "HVAC", experienceYears: 6 },
  { name: "Fathima H", email: "fathima.h@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21344", specialty: "HVAC", experienceYears: 5 },
  { name: "Siva H", email: "siva.h@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21345", specialty: "HVAC", experienceYears: 8 },
  { name: "Gowri H", email: "gowri.h@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21346", specialty: "HVAC", experienceYears: 10 },
  { name: "Ibrahim H", email: "ibrahim.h@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21347", specialty: "HVAC", experienceYears: 12 },
  { name: "Ramesh H", email: "ramesh.h@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21348", specialty: "HVAC", experienceYears: 15 },
  { name: "Velu H", email: "velu.h@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21349", specialty: "HVAC", experienceYears: 18 },

  // Housekeeping / cleaning
  { name: "Kavya D", email: "kavya.d@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21236", specialty: "HOUSEKEEPING", experienceYears: 3 },
  { name: "Anbu K", email: "anbu.k@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21351", specialty: "HOUSEKEEPING", experienceYears: 1 },
  { name: "Chitra K", email: "chitra.k@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21352", specialty: "HOUSEKEEPING", experienceYears: 2 },
  { name: "Muthu K", email: "muthu.k@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21353", specialty: "HOUSEKEEPING", experienceYears: 4 },
  { name: "Jaya K", email: "jaya.k@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21354", specialty: "HOUSEKEEPING", experienceYears: 6 },
  { name: "Rani K", email: "rani.k@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21355", specialty: "HOUSEKEEPING", experienceYears: 8 },
  { name: "Sekar K", email: "sekar.k@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21356", specialty: "HOUSEKEEPING", experienceYears: 9 },
  { name: "Valli K", email: "valli.k@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21357", specialty: "HOUSEKEEPING", experienceYears: 11 },
  { name: "Mari K", email: "mari.k@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21358", specialty: "HOUSEKEEPING", experienceYears: 14 },
  { name: "Ponnusamy K", email: "ponnusamy.k@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21359", specialty: "HOUSEKEEPING", experienceYears: 17 },

  // Transport, security, sports, medical, other
  { name: "Ajay G", email: "ajay.g@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21361", specialty: "GENERAL", experienceYears: 1 },
  { name: "Bindhu G", email: "bindhu.g@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21362", specialty: "GENERAL", experienceYears: 2 },
  { name: "Charles G", email: "charles.g@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21363", specialty: "GENERAL", experienceYears: 4 },
  { name: "Divakar G", email: "divakar.g@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21364", specialty: "GENERAL", experienceYears: 5 },
  { name: "Eswari G", email: "eswari.g@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21365", specialty: "GENERAL", experienceYears: 7 },
  { name: "Felix G", email: "felix.g@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21366", specialty: "GENERAL", experienceYears: 8 },
  { name: "Geetha G", email: "geetha.g@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21367", specialty: "GENERAL", experienceYears: 10 },
  { name: "Hari G", email: "hari.g@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21368", specialty: "GENERAL", experienceYears: 12 },
  { name: "Indira G", email: "indira.g@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21369", specialty: "GENERAL", experienceYears: 15 },
  { name: "Jegan G", email: "jegan.g@bitsathy.ac.in", department: "Facilities / Civil", phone: "99429 21370", specialty: "GENERAL", experienceYears: 18 },

  // Hostel — rooms, mess, hostel plumbing / furniture
  { name: "Selvi A", email: "selvi.a@bitsathy.ac.in", department: "Hostel Maintenance", phone: "99429 21237", specialty: "HOSTEL_MAINT", experienceYears: 5 },
  { name: "Murugan S", email: "murugan.s@bitsathy.ac.in", department: "Hostel Maintenance", phone: "99429 21204", specialty: "PLUMBER", experienceYears: 10 },
  { name: "Amutha H", email: "amutha.h@bitsathy.ac.in", department: "Hostel Maintenance", phone: "99429 21371", specialty: "HOSTEL_MAINT", experienceYears: 1 },
  { name: "Bala H", email: "bala.h@bitsathy.ac.in", department: "Hostel Maintenance", phone: "99429 21372", specialty: "PLUMBER", experienceYears: 2 },
  { name: "Chandran H", email: "chandran.h@bitsathy.ac.in", department: "Hostel Maintenance", phone: "99429 21373", specialty: "HOSTEL_MAINT", experienceYears: 3 },
  { name: "Devi H", email: "devi.h@bitsathy.ac.in", department: "Hostel Maintenance", phone: "99429 21374", specialty: "PLUMBER", experienceYears: 6 },
  { name: "Elango H", email: "elango.h@bitsathy.ac.in", department: "Hostel Maintenance", phone: "99429 21375", specialty: "HOSTEL_MAINT", experienceYears: 8 },
  { name: "Fathima M", email: "fathima.m@bitsathy.ac.in", department: "Hostel Maintenance", phone: "99429 21376", specialty: "HOSTEL_MAINT", experienceYears: 11 },
  { name: "Gopal H", email: "gopal.h@bitsathy.ac.in", department: "Hostel Maintenance", phone: "99429 21377", specialty: "PLUMBER", experienceYears: 14 },
  { name: "Hema H", email: "hema.h@bitsathy.ac.in", department: "Hostel Maintenance", phone: "99429 21378", specialty: "HOSTEL_MAINT", experienceYears: 17 },
] as const;
