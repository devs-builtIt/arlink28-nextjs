# Destinations: draft content for review

> **Status:** drafts written 2026-10-09, **not approved and not published.** Nothing here is on the site. This is a readable copy of `arlink28-api/Data/Seed/destination-content.json`, which is what the `seed-destinations` command loads. Change the wording there (or in the admin after loading) and it is picked up.

## What to check before publishing

I wrote these from general knowledge and have not checked them against a source, so a person should read each page. The statements most worth checking are the ones with numbers, dates or a claim about us:

| Page | Statement |
| ---- | --------- |
| Victoria Falls | About 100 m drop and a front of roughly 1.7 km; UNESCO World Heritage Site; bridge opened 1905; 111 m bungee; Devil's Pool open about September to December; rafting roughly August to December. |
| Zimbabwe | Great Zimbabwe built between roughly the 11th and 15th centuries, and the largest ancient stone ruin in sub-Saharan Africa. |
| Botswana | "Tourism is kept small and expensive" is a description of national policy, stated as fact. |
| Chobe, Okavango | More than 400 bird species recorded in each; Okavango flood peaks June to August; UNESCO World Heritage Site. |
| Giza | About 4,500 years old; Great Pyramid built around 2560 BCE and about 139 m tall today; Sphinx about 73 m long; site opens about 8am; the Grand Egyptian Museum shows the Tutankhamun collection together. |
| Luxor | Great Hypostyle Hall has 134 columns; Hatshepsut's temple about 3,500 years old; the standard Valley of the Kings ticket covers three tombs and Tutankhamun's costs extra. |
| Aswan and Abu Simbel | Temples cut in the 13th century BCE and moved in the 1960s; statues about 20 m; road about three hours each way; sun reaches the inner chamber around 22 February and 22 October. |
| Red Sea | Water between about 21 and 28 degrees C. |
| Cairo | Egyptian Museum open since 1902; Khan el-Khalili dates from the 14th century; many major pieces have moved to the Grand Egyptian Museum. |
| Egypt | Nile cruises of three to seven nights; "ARLink28 can arrange visa support alongside a package" is a claim about our service. Please confirm it is true. |

Coordinates are given only for towns and the falls (not for parks or regions), and are approximate.

## Photos

Nine hero photos from Unsplash (free to use under the Unsplash licence) are in `Company docs/destination-photos/`, with the credit line shown under each. Countries reuse a place's photo until you have something better: Botswana uses Chobe, Zimbabwe uses Victoria Falls, Egypt uses Giza. **Makgadikgadi Pans has no photo** (Unsplash has none of the actual pans), so it cannot be published until you add one in the admin. Moremi uses a lion photographed in the Okavango Delta.

## How it gets onto the site

1. **You apply** `arlink28-api/docs/migrations/004_destination_profiles.sql` to the database, the same way as 002 and 003.
2. **Preview:** from the `arlink28-api` folder, `dotnet run -- seed-destinations --photos="D:\Projects\ARLink28\Company docs\destination-photos" --dry-run` lists what it would fill and changes nothing.
3. **Load:** run the same command without `--dry-run`. It only fills empty fields, so anything staff have already written is kept, and running it twice is safe. It saves the photos through the configured media storage (local disk, or Supabase when that is configured).
4. **Review and publish** each destination in the admin (`/admin/destinations`). Everything stays a draft until someone publishes it; publish places first, then the country.

Not covered: Kenya, Ghana, Nairobi, Masai Mara, Samburu and Accra have no write-up yet; Tanzania and South Africa are not in the system yet.

---

## Botswana

*Country, address `/destinations/botswana`*

**Tagline:** Delta, desert and some of Africa's largest elephant herds

**Summary:** A large, thinly populated country where the safari is the reason to come: water in the north, salt pans and Kalahari sand in the middle. Tourism is kept small, so camps are few and the game viewing is uncrowded.

**Best time to visit:** May to October, the dry season. Game is easiest to see, and the Delta is at its fullest from June to August.

**Description**

Botswana is built around three landscapes. In the north, the Okavango Delta and the Chobe River bring water and wildlife into the dry season. In the middle, the Makgadikgadi salt pans stretch flat to the horizon. To the south and west, the Kalahari is open grassland and sand.

The country has chosen to keep tourism small and expensive rather than large and cheap. Camps are few, many can only be reached by light aircraft or four-wheel drive, and that is a large part of why the game viewing feels uncrowded. Plan for longer transfers and a higher price per night than in many other safari countries.

Most trips combine the Okavango Delta with Chobe, with a few nights at the pans if the dates suit. Victoria Falls is a short drive from Kasane, the gateway to Chobe, so the two are often visited together.

**Photo:** A herd of elephants drinking at the Chobe River. Photo by Rory Ashman on Unsplash (https://unsplash.com/photos/CMjB7RelPoE)


## Zimbabwe

*Country, address `/destinations/zimbabwe`*

**Tagline:** Victoria Falls, and wild country beyond it

**Summary:** Home to the Zimbabwe side of Victoria Falls, and to national parks, Lake Kariba and the ruins of Great Zimbabwe. Most visitors arrive through the town of Victoria Falls.

**Best time to visit:** May to October for game viewing. For the falls, see the Victoria Falls page.

**Description**

Victoria Falls is the reason most people come. The town beside it has an international airport, hotels and a full range of activities within minutes of the water.

Beyond the falls, Hwange National Park has some of the country's best game viewing, Lake Kariba is good for houseboats and fishing, and Great Zimbabwe, near Masvingo, is the largest ancient stone ruin in sub-Saharan Africa, built between roughly the 11th and 15th centuries.

The falls sit on the border with Zambia. The two sides give different views, and many visitors cross to see both.

**Photo:** Victoria Falls Bridge spanning the gorge below the falls. Photo by Jeremy Boley on Unsplash (https://unsplash.com/photos/lqBM9IsXhiY)


## Egypt

*Country, address `/destinations/egypt`*

**Tagline:** Five thousand years along the Nile, and a coast of coral reefs

**Summary:** Pyramids and temples in the north and the south, the Nile between them, and warm, clear water on the Red Sea coast. Most visitors combine Cairo and Giza with Luxor and Aswan, then add a few days at the sea.

**Best time to visit:** October to April for the temples and the cities. The Red Sea is good all year.

**Description**

Egypt is a trip in three parts. Cairo and Giza hold the pyramids, the old city and the museums. Upriver, Luxor and Aswan have the temples and tombs, and are often linked by a Nile cruise of three to seven nights. On the east coast, the Red Sea resorts are known for diving and snorkelling.

Summer is very hot inland, often above 40°C in Luxor and Aswan, so the temples are best visited from October to April. The sea is warm enough to swim in all year.

Most visitors need a visa before they travel. ARLink28 can arrange visa support alongside a package.

**Photo:** The Great Pyramids of Giza and the Sphinx. Photo by Dilip Poddar on Unsplash (https://unsplash.com/photos/1k7JC31SRyI)


## Victoria Falls

*Place, address `/destinations/victoria-falls`*

**Tagline:** A wall of water more than a mile wide on the Zambezi

**Summary:** The Zambezi drops about 100 metres into a narrow gorge along a front of roughly 1.7 km, on the border of Zimbabwe and Zambia. Its local name, Mosi-oa-Tunya, means "the smoke that thunders". It is a UNESCO World Heritage Site.

**Best time to visit:** February to May for the most water. September to December for the gorge, Devil's Pool and rafting.

**Description**

The falls are widest and fullest between February and May, when the spray rises high enough to be seen from far away and the viewpoints on the Zimbabwe side are often soaked. From September to December the river is low, parts of the cliff are bare, and you can see the shape of the gorge. Both are worth seeing; they are different trips.

The Zimbabwe side has the long cliff-top walk with the main viewpoints, and the town of Victoria Falls with its airport, hotels and activities. The Zambian side, reached through Livingstone, is closer to the edge of the falls, and it is where Devil's Pool, a natural pool at the lip of the falls, is open when the river is low. Many visitors cross to see both sides. You can cross on foot over the bridge or by road; check the visa rules for your passport before you travel.

Above the falls the Zambezi is wide and slow, which is why the sunset cruises, canoe trips and river safaris start there. Below them the river runs through the Batoka Gorge, where the rafting is.

**Things to do**

- **The falls viewpoints.** A cliff-top path on the Zimbabwe side runs along the front of the falls, with viewpoints looking straight across at the water. Take a raincoat from February to May.
- **Victoria Falls Bridge.** Opened in 1905 across the Batoka Gorge, it links Zimbabwe and Zambia just below the falls. Walk to the middle for the view, or take the 111 m bungee jump or the gorge swing.
- **Zambezi sunset cruise.** Two to three hours on the river above the falls, usually with drinks and snacks. Hippo, crocodile and elephant on the banks are common sights.
- **White-water rafting.** Day trips through the rapids of the Batoka Gorge below the falls, run when the river is low, roughly August to December. Grades vary, so check which suits you.
- **Devil's Pool.** A natural rock pool at the edge of the falls on the Zambian side, reached from Livingstone Island. It is open only when the river is low, around September to December.
- **Zambezi National Park.** River frontage and woodland a short drive upstream of the town, with elephant, buffalo and sable antelope. Self-drive and guided game drives are both possible.

**Photo:** Victoria Falls Bridge spanning the gorge below the falls. Photo by Jeremy Boley on Unsplash (https://unsplash.com/photos/lqBM9IsXhiY)


## Chobe National Park

*Place, address `/destinations/chobe-national-park`*

**Tagline:** Elephants at the river, from a boat or a vehicle

**Summary:** Chobe lies on the Chobe River in northern Botswana, beside the town of Kasane. In the dry season large herds of elephant come down to drink, and a boat on the river is often the best place to watch them.

**Best time to visit:** May to September, when the herds are at the river. The rains from November to March bring green scenery and birds, with game more spread out.

**Description**

Chobe is one of the best places in Africa to see elephants. As the dry season goes on, the herds move toward the permanent water of the Chobe River, and by August and September they can be seen drinking and crossing the channels in numbers.

Most visitors stay near Kasane, on the river, and split their time between boat trips and game drives along the riverfront. A boat puts you at eye level with the animals and lets you get close without disturbing them. Buffalo, hippo, crocodile, giraffe and a wide range of birds are also common.

Further into the park, Savuti and the Linyanti are quieter and better for predators, but they need more time and are reached by four-wheel drive or light aircraft, usually from a camp.

**Things to do**

- **Chobe River boat safari.** Two to three hours on the water, usually in the late afternoon. Elephant, hippo and crocodile are close to the bank, and the light is good for photographs.
- **Game drive along the riverfront.** Vehicle drives on the tracks beside the river, best in the early morning. Elephant, buffalo and giraffe are likely; lion and leopard with some luck.
- **Savuti.** A remote area in the west of the park, known for lion and spotted hyena hunting near the channel. Reached by four-wheel drive or light aircraft, usually as part of a camp stay.
- **Elephant crossings.** In the dry season herds swim and wade between the islands in the river. Ask your guide where they are crossing that week; it changes.
- **Birdwatching.** More than 400 species have been recorded in the park, including African fish eagle and African skimmer, and carmine bee-eaters nesting in the riverbanks in season.

**Photo:** A herd of elephants drinking at the Chobe River. Photo by Rory Ashman on Unsplash (https://unsplash.com/photos/CMjB7RelPoE)


## Okavango Delta

*Place, address `/destinations/okavango-delta`*

**Tagline:** A river that ends in the desert

**Summary:** The Okavango River flows in from Angola and spreads across the Kalahari instead of reaching the sea. The flood arrives in the dry season, so the best water and the best game viewing come at the same time. It is a UNESCO World Heritage Site.

**Best time to visit:** June to October. The flood peaks from June to August, and game is easiest to see as the land dries.

**Description**

The delta is a maze of channels, lagoons and islands covering many thousands of square kilometres, and it changes shape every year with the flood. The rain falls in Angola in the summer, and the water takes months to arrive: it is highest in Botswana from about June to August, when the land around it is at its driest.

Most camps are on islands or on the edge of the floodplains and are reached by light aircraft. What you do depends on the water level: mokoro trips (a traditional dugout canoe poled by a guide) and boat trips when the channels are full, walking safaris on the islands, and game drives where the land is dry. Wildlife includes elephant, buffalo, lion, leopard, wild dog, hippo and red lechwe.

A scenic flight shows the scale of the delta in a way nothing on the ground can.

**Things to do**

- **Mokoro trip.** A quiet trip through the reeds in a dugout canoe poled by a guide. You see frogs, birds and small antelope at close range rather than big game.
- **Walking safari.** A guided walk on an island. A slow way to read tracks and notice smaller animals, with the guide keeping you well away from dangerous game.
- **Scenic flight.** Light-aircraft flights at low altitude show the channels, lagoons and game trails from above. Often combined with the transfer to your camp.
- **Island game drives.** Open vehicles on the larger islands and the dry floodplain, where lion, leopard and elephant feed and hunt near the water.
- **Birdwatching.** More than 400 species, among them African fish eagle and the rarely seen Pel's fishing owl.

**Photo:** Aerial view of the Okavango river winding through the delta. Photo by Wynand Uys on Unsplash (https://unsplash.com/photos/4ZCA3xukIso)


## Moremi Game Reserve

*Place, address `/destinations/moremi-game-reserve`*

**Tagline:** Land and water side by side on the east of the Okavango Delta

**Summary:** Moremi covers the eastern part of the delta, where dry land and permanent water sit next to each other. It is one of the best places in Botswana to see lion, leopard and wild dog, and it can be explored by vehicle and by boat.

**Best time to visit:** May to October.

**Description**

Moremi is a reserve of lagoons, floodplain, mopane woodland and open grassland. The mix of habitats supports a high density of animals, and the big cats and wild dog are the main reason people choose it.

The reserve is reached by road from Maun or by air to the airstrips near the camps. Some camps are inside the reserve and others sit on its edge. The tracks are sand and can be hard going, and the area around the Third Bridge needs a four-wheel-drive vehicle in the wet months.

Because it is part of the delta, the same flood timing applies: the water is highest from June to August, and game viewing is best from May to October.

**Things to do**

- **Game drives.** Morning and late-afternoon drives on sand tracks through woodland and floodplain, looking for lion, leopard and wild dog.
- **Xakanaxa lagoon.** A large lagoon on the east side of the reserve, with boat trips and a lot of birdlife, including herons, storks and fish eagles.
- **Third Bridge.** Timber bridges over deep channels in the north of the reserve, known for lion and for its campsite. Reached by four-wheel drive.
- **Camping safari.** Public campsites inside the reserve allow a self-drive or mobile-camping trip. Book well ahead, and bring a vehicle suited to sand and water.

**Photo:** A male lion resting in long grass in the Okavango Delta. Photo by Colin Watts on Unsplash (https://unsplash.com/photos/gOcNtvHNGu0)


## Makgadikgadi Pans

*Place, address `/destinations/makgadikgadi-pans`*

**Tagline:** Salt flats that run to the horizon

**Summary:** One of the largest salt pan systems in the world, in the dry heart of Botswana. In the dry months it is a bright, empty plain; after the rains it draws zebra, wildebeest and flamingos.

**Best time to visit:** November to April for zebra, wildebeest and flamingos. May to October for quad biking and the empty pans.

**Description**

The Makgadikgadi is what remains of an ancient lake. Two main pans, Sua and Ntwetwe, and a number of smaller ones are separated by grassland and palm islands. In the dry season the surface is white and cracked, and the silence and scale are the main attraction.

When the rains arrive, usually from November, zebra and wildebeest move onto the grasslands around the pans, and the shallow water can bring flamingos. The dry months are better for quad biking across the pans, sleeping out under the stars, and meeting meerkat colonies that are used to visitors and can be watched at close range at dawn.

Nearby, Nxai Pan National Park and Kubu Island add game viewing and a granite outcrop on the edge of the Sua pan. The area is reached by road from Maun or by air to the camps.

**Things to do**

- **Quad biking on the pans.** Guided rides across the dry salt surface, with a stop for sunset. Only in the dry months, roughly April to October.
- **Sleeping out on the pans.** A bedroll in the open under the stars, with no light for many kilometres. Offered by camps in the dry season.
- **Meerkat colonies.** Groups used to visitors, watched on foot at sunrise as they come out of their burrows.
- **Zebra and wildebeest.** From about November, herds arrive on the grasslands around the pans after the first rains.
- **Kubu Island.** A granite outcrop with baobabs, rising from the edge of the Sua pan. Remote; visits are usually by four-wheel drive with a guide.

**Photo:** none yet.


## Giza

*Place, address `/destinations/giza`*

**Tagline:** The pyramids and the Sphinx, on the edge of Cairo

**Summary:** The Giza plateau has three large pyramids, built about 4,500 years ago for the pharaohs Khufu, Khafre and Menkaure, and the Great Sphinx. It sits on the western edge of Cairo.

**Best time to visit:** October to April, when it is cooler. Early morning is best all year.

**Description**

The Great Pyramid of Khufu is the oldest and largest of the three, and the only one of the Seven Wonders of the Ancient World still standing. Beside it are the pyramids of Khafre and Menkaure, smaller temples, and the Great Sphinx, carved from the bedrock of the plateau.

Go early. The site opens at about 8am, the heat builds quickly, and the tour groups arrive by mid-morning. Climbing the outside of the pyramids is not allowed. A ticket for the inside of the Great Pyramid is separate and limited, and the passage is narrow and low. Camel and horse rides are offered at the edge of the site; agree the price first.

The Grand Egyptian Museum stands at the edge of the plateau and shows the Tutankhamun collection together in one place. It is a good half day on its own.

**Things to do**

- **The Great Pyramid.** Built for Khufu around 2560 BCE and about 139 metres tall today. Entry to the inside is by a separate ticket.
- **The Great Sphinx.** A limestone figure about 73 metres long, carved from the bedrock beside the causeway to Khafre's pyramid.
- **Pyramids of Khafre and Menkaure.** Khafre's pyramid looks taller because it stands on higher ground and keeps some of its original casing at the top. Menkaure's is the smallest of the three.
- **The panoramic viewpoint.** A raised spot on the desert side of the plateau with all three pyramids in one frame. A good place for photographs and the usual stop on a tour.
- **Grand Egyptian Museum.** A large museum at the edge of the plateau, with the Tutankhamun collection shown together. Allow at least half a day, and book tickets ahead.

**Photo:** The Great Pyramids of Giza and the Sphinx. Photo by Dilip Poddar on Unsplash (https://unsplash.com/photos/1k7JC31SRyI)


## Luxor

*Place, address `/destinations/luxor`*

**Tagline:** Temples and tombs on both banks of the Nile

**Summary:** Luxor stands on the site of ancient Thebes. The temples of Karnak and Luxor are on the east bank, and the Valley of the Kings and the temple of Hatshepsut are on the west.

**Best time to visit:** October to April. In summer, go at first light.

**Description**

Luxor works best as two days. On the east bank, Karnak is a huge complex of temples, columns and obelisks built over some two thousand years, and Luxor Temple, in the middle of the town, is lit at night.

On the west bank, the Valley of the Kings holds the rock-cut tombs of the pharaohs of the New Kingdom, including Tutankhamun's. Nearby are the terraced temple of Queen Hatshepsut, the Colossi of Memnon and the Valley of the Queens. Tickets are sold per tomb, so choose the ones you want to see.

Summers are very hot. The sites are best from October to April, and the first hours of the day are the coolest. Hot-air balloon flights over the west bank leave at dawn. Luxor is also the usual start or end of a Nile cruise to Aswan.

**Things to do**

- **Karnak Temple.** The largest temple complex in Egypt, with the Great Hypostyle Hall of 134 columns. Allow at least half a day.
- **Luxor Temple.** A temple on the east bank in the middle of town, linked to Karnak by an avenue of sphinxes. It is lit in the evening, and quieter then.
- **Valley of the Kings.** The rock-cut tombs of New Kingdom pharaohs. The standard ticket covers three tombs; some, including Tutankhamun's, cost extra.
- **Temple of Hatshepsut.** A terraced temple cut into the cliffs at Deir el-Bahari, built for the female pharaoh Hatshepsut about 3,500 years ago.
- **Hot-air balloon at dawn.** Flights over the west bank at sunrise, weather permitting. Book ahead, and expect an early pickup.

**Photo:** The temple ruins and obelisk of Karnak, Luxor. Photo by 2H Media on Unsplash (https://unsplash.com/photos/mX4N-J4KCnU)


## Aswan and Abu Simbel

*Place, address `/destinations/aswan`*

**Tagline:** The Nile at its calmest, and the temples of Ramesses II

**Summary:** Aswan is the southern end of the classic Nile route, with islands, Nubian villages and the temple of Philae. Abu Simbel, with its giant rock-cut temples, is about three hours south by road, near the border with Sudan.

**Best time to visit:** October to April. Abu Simbel is busiest around 22 February and 22 October.

**Description**

Aswan is smaller and calmer than Luxor. The Nile runs through granite boulders and islands here, and the usual way to spend an evening is on a felucca, a traditional sailboat, around Elephantine Island and the Botanical Garden. Nubian villages on the west bank can be visited by boat. The Aswan High Dam, built in the 1960s, created Lake Nasser to the south.

The temple of Philae, dedicated to the goddess Isis, was moved to the island of Agilkia when the dam flooded its original island.

Abu Simbel is a long day trip: most visitors leave Aswan before dawn, and the road takes about three hours each way. The two temples were cut into the cliff by Ramesses II in the 13th century BCE, and moved to higher ground in the 1960s to save them from Lake Nasser. Twice a year, around 22 February and 22 October, the sun reaches the innermost chamber of the great temple.

**Things to do**

- **Abu Simbel.** Two temples cut into a cliff by Ramesses II, the larger guarded by four seated statues about 20 metres high. A day trip, about three hours each way by road.
- **Philae Temple.** A temple of Isis, reached by a short boat ride, rebuilt on Agilkia Island when its original island was flooded by the dam.
- **Felucca sail.** A traditional sailboat on the Nile around Elephantine Island and the Botanical Garden, best late in the day.
- **Nubian village visit.** Boat trips to villages on the west bank, with a meal and a look at the painted houses.
- **Aswan High Dam.** A short stop on most tours. The dam holds back Lake Nasser, one of the largest man-made lakes in the world.

**Photo:** The Great Temple of Ramesses II at Abu Simbel. Photo by Dmitrii Zhodzishskii on Unsplash (https://unsplash.com/photos/BSv0T4uRWew)


## Red Sea

*Place, address `/destinations/red-sea`*

**Tagline:** Coral reefs and warm water, all year

**Summary:** Egypt's Red Sea coast runs from Hurghada south to Marsa Alam and, across the Gulf of Suez, to the Sinai resorts. The water stays warm in every month, and the reefs are close to shore.

**Best time to visit:** All year. March to May and September to November are the most comfortable.

**Description**

The coast is mainly a place for diving, snorkelling and beach time. Hurghada is the largest resort area and has direct flights from many cities. Marsa Alam, further south, is quieter and closer to the more remote reefs, where turtles and dugongs are sometimes seen. Sharm el-Sheikh and Dahab, in Sinai, are known for reef walls, wrecks and sheltered house reefs.

The water stays between about 21°C in winter and 28°C in summer. Summer air temperatures are high; spring and autumn are the most comfortable. Many visitors add a few days here after Cairo and Luxor.

**Things to do**

- **Snorkelling and diving.** Reefs start close to the beach at many resorts, and boats reach offshore sites in a few hours. Beginners' courses run all year.
- **Marsa Alam.** A quieter stretch of coast to the south, with remote reefs and a chance of turtles and dugongs at some sites.
- **Ras Mohammed National Park.** A protected marine park at the southern tip of Sinai, with steep reef walls and large shoals of fish. Usually a boat day from Sharm el-Sheikh.
- **Island boat trips.** Half-day and full-day trips to islands such as Giftun, off Hurghada, with stops to swim and snorkel.
- **Desert safari.** Quad and jeep trips into the Eastern Desert from the coast, usually ending with dinner in a Bedouin-style camp.

**Photo:** Coral reef in the clear water of the Red Sea. Photo by Francesco Ungaro on Unsplash (https://unsplash.com/photos/LKAqmDHVeug)


## Cairo

*Place, address `/destinations/cairo`*

**Tagline:** A large, loud city with a thousand years of old buildings

**Summary:** Egypt's capital, on the Nile, with the mosques and markets of Islamic Cairo, the churches of Coptic Cairo, and the citadel above the old city. Most visitors pair it with the pyramids at Giza.

**Best time to visit:** October to April.

**Description**

Cairo is large, busy and loud, and it works best with one or two things planned a day rather than five. Traffic is heavy, so allow longer than the map suggests between places.

Islamic Cairo has a dense collection of medieval mosques, schools and gates, many from the 13th and 14th centuries, around the Khan el-Khalili bazaar and Al-Muizz Street. The Citadel of Saladin, above the old city, holds the Mosque of Muhammad Ali with its two tall minarets. Coptic Cairo, in the south, has some of the oldest churches in Egypt.

The Egyptian Museum on Tahrir Square holds a vast collection from the time of the pharaohs, though many of the major pieces have moved to the Grand Egyptian Museum at Giza. Cairo is hot in summer and mild in winter, so the cooler months are the best time to go.

**Things to do**

- **Khan el-Khalili.** A bazaar of alleys and workshops, dating from the 14th century, selling spices, metalwork and gifts. Best in the evening; prices are negotiable.
- **Citadel of Saladin.** A medieval fortress on a hill above the city, with the Mosque of Muhammad Ali and wide views over Cairo.
- **Al-Muizz Street.** A street of mosques, schools and old gates from the 10th to the 19th centuries, best walked in the morning.
- **Coptic Cairo.** A walled quarter in the south with the Hanging Church, the Coptic Museum and the Ben Ezra Synagogue, close together and easy to see in a morning.
- **Egyptian Museum.** The museum on Tahrir Square, open since 1902, with a vast collection of antiquities. Check which major pieces are on display, as many have moved to the Grand Egyptian Museum.

**Photo:** Mosques and minarets above the Cairo skyline. Photo by Dimitry B on Unsplash (https://unsplash.com/photos/hxvl0wdAdso)
