# Generation I Pokémon Reference (Kanto — 151)

Single source of truth for Gen 1 Pokémon data used in the Pokédex and related features. Types and names are canonical (aligned with Pokémon Database / PokeAPI). Use this document to add or reference extra info per Pokémon as needed.

---

## Format

- **№** — National Pokédex number
- **Name** — Official English name
- **Types** — One or two types (current type chart)
- **Lore** — ✓ when a lore summary exists (see [Lore Summaries](#lore-summaries) below; used in Pokedex popups)
- **Notes** — Reserved for future research and extra info per Pokémon

**Physical data** (height, weight, gender ratio) for all 151 is in [Physical data](#physical-data-height-weight-gender-ratio) below. Source: PokeAPI (pokemon: height in dm → m, weight in hg → kg; species: gender_rate). Used in code via `src/data/gen1PokemonPhysical.js`.

---

## The 151

| № | Name | Types | Lore | Notes |
|---|------|-------|------|--------|
| 001 | Bulbasaur | Grass, Poison | | |
| 002 | Ivysaur | Grass, Poison | | |
| 003 | Venusaur | Grass, Poison | | |
| 004 | Charmander | Fire | | |
| 005 | Charmeleon | Fire | | |
| 006 | Charizard | Fire, Flying | | |
| 007 | Squirtle | Water | | |
| 008 | Wartortle | Water | | |
| 009 | Blastoise | Water | | |
| 010 | Caterpie | Bug | | |
| 011 | Metapod | Bug | | |
| 012 | Butterfree | Bug, Flying | | |
| 013 | Weedle | Bug, Poison | | |
| 014 | Kakuna | Bug, Poison | | |
| 015 | Beedrill | Bug, Poison | | |
| 016 | Pidgey | Normal, Flying | | |
| 017 | Pidgeotto | Normal, Flying | | |
| 018 | Pidgeot | Normal, Flying | | |
| 019 | Rattata | Normal | | |
| 020 | Raticate | Normal | | |
| 021 | Spearow | Normal, Flying | | |
| 022 | Fearow | Normal, Flying | | |
| 023 | Ekans | Poison | | |
| 024 | Arbok | Poison | | |
| 025 | Pikachu | Electric | | |
| 026 | Raichu | Electric | | |
| 027 | Sandshrew | Ground | | |
| 028 | Sandslash | Ground | | |
| 029 | Nidoran♀ | Poison | | |
| 030 | Nidorina | Poison | | |
| 031 | Nidoqueen | Poison, Ground | | |
| 032 | Nidoran♂ | Poison | | |
| 033 | Nidorino | Poison | | |
| 034 | Nidoking | Poison, Ground | | |
| 035 | Clefairy | Fairy | | |
| 036 | Clefable | Fairy | | |
| 037 | Vulpix | Fire | | |
| 038 | Ninetales | Fire | | |
| 039 | Jigglypuff | Normal, Fairy | ✓ | |
| 040 | Wigglytuff | Normal, Fairy | | |
| 041 | Zubat | Poison, Flying | | |
| 042 | Golbat | Poison, Flying | | |
| 043 | Oddish | Grass, Poison | | |
| 044 | Gloom | Grass, Poison | | |
| 045 | Vileplume | Grass, Poison | | |
| 046 | Paras | Bug, Grass | ✓ | |
| 047 | Parasect | Bug, Grass | | |
| 048 | Venonat | Bug, Poison | | |
| 049 | Venomoth | Bug, Poison | | |
| 050 | Diglett | Ground | | |
| 051 | Dugtrio | Ground | | |
| 052 | Meowth | Normal | | |
| 053 | Persian | Normal | | |
| 054 | Psyduck | Water | | |
| 055 | Golduck | Water | | |
| 056 | Mankey | Fighting | | |
| 057 | Primeape | Fighting | | |
| 058 | Growlithe | Fire | | |
| 059 | Arcanine | Fire | | |
| 060 | Poliwag | Water | | |
| 061 | Poliwhirl | Water | | |
| 062 | Poliwrath | Water, Fighting | | |
| 063 | Abra | Psychic | | |
| 064 | Kadabra | Psychic | | |
| 065 | Alakazam | Psychic | | |
| 066 | Machop | Fighting | | |
| 067 | Machoke | Fighting | | |
| 068 | Machamp | Fighting | | |
| 069 | Bellsprout | Grass, Poison | | |
| 070 | Weepinbell | Grass, Poison | | |
| 071 | Victreebel | Grass, Poison | | |
| 072 | Tentacool | Water, Poison | | |
| 073 | Tentacruel | Water, Poison | | |
| 074 | Geodude | Rock, Ground | | |
| 075 | Graveler | Rock, Ground | | |
| 076 | Golem | Rock, Ground | | |
| 077 | Ponyta | Fire | | |
| 078 | Rapidash | Fire | | |
| 079 | Slowpoke | Water, Psychic | | |
| 080 | Slowbro | Water, Psychic | | |
| 081 | Magnemite | Electric, Steel | | |
| 082 | Magneton | Electric, Steel | | |
| 083 | Farfetch'd | Normal, Flying | | |
| 084 | Doduo | Normal, Flying | | |
| 085 | Dodrio | Normal, Flying | | |
| 086 | Seel | Water | | |
| 087 | Dewgong | Water, Ice | | |
| 088 | Grimer | Poison | | |
| 089 | Muk | Poison | | |
| 090 | Shellder | Water | | |
| 091 | Cloyster | Water, Ice | | |
| 092 | Gastly | Ghost, Poison | | |
| 093 | Haunter | Ghost, Poison | | |
| 094 | Gengar | Ghost, Poison | | |
| 095 | Onix | Rock, Ground | | |
| 096 | Drowzee | Psychic | | |
| 097 | Hypno | Psychic | | |
| 098 | Krabby | Water | | |
| 099 | Kingler | Water | | |
| 100 | Voltorb | Electric | | |
| 101 | Electrode | Electric | | |
| 102 | Exeggcute | Grass, Psychic | | |
| 103 | Exeggutor | Grass, Psychic | | |
| 104 | Cubone | Ground | | |
| 105 | Marowak | Ground | | |
| 106 | Hitmonlee | Fighting | | |
| 107 | Hitmonchan | Fighting | | |
| 108 | Lickitung | Normal | | |
| 109 | Koffing | Poison | | |
| 110 | Weezing | Poison | | |
| 111 | Rhyhorn | Ground, Rock | | |
| 112 | Rhydon | Ground, Rock | | |
| 113 | Chansey | Normal | | |
| 114 | Tangela | Grass | | |
| 115 | Kangaskhan | Normal | | |
| 116 | Horsea | Water | | |
| 117 | Seadra | Water | | |
| 118 | Goldeen | Water | | |
| 119 | Seaking | Water | | |
| 120 | Staryu | Water | | |
| 121 | Starmie | Water, Psychic | | |
| 122 | Mr. Mime | Psychic, Fairy | | |
| 123 | Scyther | Bug, Flying | | |
| 124 | Jynx | Ice, Psychic | | |
| 125 | Electabuzz | Electric | | |
| 126 | Magmar | Fire | | |
| 127 | Pinsir | Bug | | |
| 128 | Tauros | Normal | | |
| 129 | Magikarp | Water | | |
| 130 | Gyarados | Water, Flying | | |
| 131 | Lapras | Water, Ice | | |
| 132 | Ditto | Normal | | |
| 133 | Eevee | Normal | | |
| 134 | Vaporeon | Water | | |
| 135 | Jolteon | Electric | | |
| 136 | Flareon | Fire | | |
| 137 | Porygon | Normal | | |
| 138 | Omanyte | Rock, Water | | |
| 139 | Omastar | Rock, Water | | |
| 140 | Kabuto | Rock, Water | | |
| 141 | Kabutops | Rock, Water | | |
| 142 | Aerodactyl | Rock, Flying | | |
| 143 | Snorlax | Normal | ✓ | |
| 144 | Articuno | Ice, Flying | | |
| 145 | Zapdos | Electric, Flying | | |
| 146 | Moltres | Fire, Flying | | |
| 147 | Dratini | Dragon | | |
| 148 | Dragonair | Dragon | | |
| 149 | Dragonite | Dragon, Flying | | |
| 150 | Mewtwo | Psychic | ✓ | |
| 151 | Mew | Psychic | | |

---

## Physical data (height, weight, gender ratio)

Source: [PokeAPI](https://pokeapi.co) — `pokemon` (height in decimetres → m, weight in hectograms → kg), `pokemon-species` (gender_rate). Used in code: `src/data/gen1PokemonPhysical.js` → `GEN_1_POKEMON_PHYSICAL[id]`.

| № | Name | Height (m) | Weight (kg) | Gender ratio |
|---|------|------------|-------------|--------------|
| 001 | Bulbasaur | 0.7 | 6.9 | 12.5% ♀ / 87.5% ♂ |
| 002 | Ivysaur | 1.0 | 13.0 | 12.5% ♀ / 87.5% ♂ |
| 003 | Venusaur | 2.0 | 100.0 | 12.5% ♀ / 87.5% ♂ |
| 004 | Charmander | 0.6 | 8.5 | 12.5% ♀ / 87.5% ♂ |
| 005 | Charmeleon | 1.1 | 19.0 | 12.5% ♀ / 87.5% ♂ |
| 006 | Charizard | 1.7 | 90.5 | 12.5% ♀ / 87.5% ♂ |
| 007 | Squirtle | 0.5 | 9.0 | 12.5% ♀ / 87.5% ♂ |
| 008 | Wartortle | 1.0 | 22.5 | 12.5% ♀ / 87.5% ♂ |
| 009 | Blastoise | 1.6 | 85.5 | 12.5% ♀ / 87.5% ♂ |
| 010 | Caterpie | 0.3 | 2.9 | 50% ♀ / 50% ♂ |
| 011 | Metapod | 0.7 | 9.9 | 50% ♀ / 50% ♂ |
| 012 | Butterfree | 1.1 | 32.0 | 50% ♀ / 50% ♂ |
| 013 | Weedle | 0.3 | 3.2 | 50% ♀ / 50% ♂ |
| 014 | Kakuna | 0.6 | 10.0 | 50% ♀ / 50% ♂ |
| 015 | Beedrill | 1.0 | 29.5 | 50% ♀ / 50% ♂ |
| 016 | Pidgey | 0.3 | 1.8 | 50% ♀ / 50% ♂ |
| 017 | Pidgeotto | 1.1 | 30.0 | 50% ♀ / 50% ♂ |
| 018 | Pidgeot | 1.5 | 39.5 | 50% ♀ / 50% ♂ |
| 019 | Rattata | 0.3 | 3.5 | 50% ♀ / 50% ♂ |
| 020 | Raticate | 0.7 | 18.5 | 50% ♀ / 50% ♂ |
| 021 | Spearow | 0.3 | 2.0 | 50% ♀ / 50% ♂ |
| 022 | Fearow | 1.2 | 38.0 | 50% ♀ / 50% ♂ |
| 023 | Ekans | 2.0 | 6.9 | 50% ♀ / 50% ♂ |
| 024 | Arbok | 3.5 | 65.0 | 50% ♀ / 50% ♂ |
| 025 | Pikachu | 0.4 | 6.0 | 50% ♀ / 50% ♂ |
| 026 | Raichu | 0.8 | 30.0 | 50% ♀ / 50% ♂ |
| 027 | Sandshrew | 0.6 | 12.0 | 50% ♀ / 50% ♂ |
| 028 | Sandslash | 1.0 | 29.5 | 50% ♀ / 50% ♂ |
| 029 | Nidoran♀ | 0.4 | 7.0 | 100% ♀ |
| 030 | Nidorina | 0.8 | 20.0 | 100% ♀ |
| 031 | Nidoqueen | 1.3 | 60.0 | 100% ♀ |
| 032 | Nidoran♂ | 0.5 | 9.0 | 100% ♂ |
| 033 | Nidorino | 0.9 | 19.5 | 100% ♂ |
| 034 | Nidoking | 1.4 | 62.0 | 100% ♂ |
| 035 | Clefairy | 0.6 | 7.5 | 75% ♀ / 25% ♂ |
| 036 | Clefable | 1.3 | 40.0 | 75% ♀ / 25% ♂ |
| 037 | Vulpix | 0.6 | 9.9 | 75% ♀ / 25% ♂ |
| 038 | Ninetales | 1.1 | 19.9 | 75% ♀ / 25% ♂ |
| 039 | Jigglypuff | 0.5 | 5.5 | 75% ♀ / 25% ♂ |
| 040 | Wigglytuff | 1.0 | 12.0 | 75% ♀ / 25% ♂ |
| 041 | Zubat | 0.8 | 7.5 | 50% ♀ / 50% ♂ |
| 042 | Golbat | 1.6 | 55.0 | 50% ♀ / 50% ♂ |
| 043 | Oddish | 0.5 | 5.4 | 50% ♀ / 50% ♂ |
| 044 | Gloom | 0.8 | 8.6 | 50% ♀ / 50% ♂ |
| 045 | Vileplume | 1.2 | 18.6 | 50% ♀ / 50% ♂ |
| 046 | Paras | 0.3 | 5.4 | 50% ♀ / 50% ♂ |
| 047 | Parasect | 1.0 | 29.5 | 50% ♀ / 50% ♂ |
| 048 | Venonat | 1.0 | 30.0 | 50% ♀ / 50% ♂ |
| 049 | Venomoth | 1.5 | 12.5 | 50% ♀ / 50% ♂ |
| 050 | Diglett | 0.2 | 0.8 | 50% ♀ / 50% ♂ |
| 051 | Dugtrio | 0.7 | 33.3 | 50% ♀ / 50% ♂ |
| 052 | Meowth | 0.4 | 4.2 | 50% ♀ / 50% ♂ |
| 053 | Persian | 1.0 | 32.0 | 50% ♀ / 50% ♂ |
| 054 | Psyduck | 0.8 | 19.6 | 50% ♀ / 50% ♂ |
| 055 | Golduck | 1.7 | 76.6 | 50% ♀ / 50% ♂ |
| 056 | Mankey | 0.5 | 28.0 | 25% ♀ / 75% ♂ |
| 057 | Primeape | 1.0 | 32.0 | 25% ♀ / 75% ♂ |
| 058 | Growlithe | 0.7 | 19.0 | 25% ♀ / 75% ♂ |
| 059 | Arcanine | 1.9 | 155.0 | 25% ♀ / 75% ♂ |
| 060 | Poliwag | 0.6 | 12.4 | 50% ♀ / 50% ♂ |
| 061 | Poliwhirl | 1.0 | 20.0 | 50% ♀ / 50% ♂ |
| 062 | Poliwrath | 1.3 | 54.0 | 50% ♀ / 50% ♂ |
| 063 | Abra | 0.9 | 19.5 | 25% ♀ / 75% ♂ |
| 064 | Kadabra | 1.3 | 56.5 | 25% ♀ / 75% ♂ |
| 065 | Alakazam | 1.5 | 48.0 | 25% ♀ / 75% ♂ |
| 066 | Machop | 0.8 | 19.5 | 25% ♀ / 75% ♂ |
| 067 | Machoke | 1.5 | 70.5 | 25% ♀ / 75% ♂ |
| 068 | Machamp | 1.6 | 130.0 | 25% ♀ / 75% ♂ |
| 069 | Bellsprout | 0.7 | 4.0 | 50% ♀ / 50% ♂ |
| 070 | Weepinbell | 1.0 | 6.4 | 50% ♀ / 50% ♂ |
| 071 | Victreebel | 1.7 | 15.5 | 50% ♀ / 50% ♂ |
| 072 | Tentacool | 0.9 | 45.5 | 50% ♀ / 50% ♂ |
| 073 | Tentacruel | 1.6 | 55.0 | 50% ♀ / 50% ♂ |
| 074 | Geodude | 0.4 | 20.0 | 50% ♀ / 50% ♂ |
| 075 | Graveler | 1.0 | 105.0 | 50% ♀ / 50% ♂ |
| 076 | Golem | 1.4 | 300.0 | 50% ♀ / 50% ♂ |
| 077 | Ponyta | 1.0 | 30.0 | 50% ♀ / 50% ♂ |
| 078 | Rapidash | 1.7 | 95.0 | 50% ♀ / 50% ♂ |
| 079 | Slowpoke | 1.2 | 36.0 | 50% ♀ / 50% ♂ |
| 080 | Slowbro | 1.6 | 78.5 | 50% ♀ / 50% ♂ |
| 081 | Magnemite | 0.3 | 6.0 | Genderless |
| 082 | Magneton | 1.0 | 60.0 | Genderless |
| 083 | Farfetch'd | 0.8 | 15.0 | 50% ♀ / 50% ♂ |
| 084 | Doduo | 1.4 | 39.2 | 50% ♀ / 50% ♂ |
| 085 | Dodrio | 1.8 | 85.2 | 50% ♀ / 50% ♂ |
| 086 | Seel | 1.1 | 90.0 | 50% ♀ / 50% ♂ |
| 087 | Dewgong | 1.7 | 120.0 | 50% ♀ / 50% ♂ |
| 088 | Grimer | 0.9 | 30.0 | 50% ♀ / 50% ♂ |
| 089 | Muk | 1.2 | 30.0 | 50% ♀ / 50% ♂ |
| 090 | Shellder | 0.3 | 4.0 | 50% ♀ / 50% ♂ |
| 091 | Cloyster | 1.5 | 132.5 | 50% ♀ / 50% ♂ |
| 092 | Gastly | 1.3 | 0.1 | 50% ♀ / 50% ♂ |
| 093 | Haunter | 1.6 | 0.1 | 50% ♀ / 50% ♂ |
| 094 | Gengar | 1.5 | 40.5 | 50% ♀ / 50% ♂ |
| 095 | Onix | 8.8 | 210.0 | 50% ♀ / 50% ♂ |
| 096 | Drowzee | 1.0 | 32.4 | 50% ♀ / 50% ♂ |
| 097 | Hypno | 1.6 | 75.6 | 50% ♀ / 50% ♂ |
| 098 | Krabby | 0.4 | 6.5 | 50% ♀ / 50% ♂ |
| 099 | Kingler | 1.3 | 60.0 | 50% ♀ / 50% ♂ |
| 100 | Voltorb | 0.5 | 10.4 | Genderless |
| 101 | Electrode | 1.2 | 66.6 | Genderless |
| 102 | Exeggcute | 0.4 | 2.5 | 50% ♀ / 50% ♂ |
| 103 | Exeggutor | 2.0 | 120.0 | 50% ♀ / 50% ♂ |
| 104 | Cubone | 0.4 | 6.5 | 50% ♀ / 50% ♂ |
| 105 | Marowak | 1.0 | 45.0 | 50% ♀ / 50% ♂ |
| 106 | Hitmonlee | 1.5 | 49.8 | 100% ♂ |
| 107 | Hitmonchan | 1.4 | 50.2 | 100% ♂ |
| 108 | Lickitung | 1.2 | 65.5 | 50% ♀ / 50% ♂ |
| 109 | Koffing | 0.6 | 1.0 | 50% ♀ / 50% ♂ |
| 110 | Weezing | 1.2 | 9.5 | 50% ♀ / 50% ♂ |
| 111 | Rhyhorn | 1.0 | 115.0 | 50% ♀ / 50% ♂ |
| 112 | Rhydon | 1.9 | 120.0 | 50% ♀ / 50% ♂ |
| 113 | Chansey | 1.1 | 34.6 | 100% ♀ |
| 114 | Tangela | 1.0 | 35.0 | 50% ♀ / 50% ♂ |
| 115 | Kangaskhan | 2.2 | 80.0 | 100% ♀ |
| 116 | Horsea | 0.4 | 8.0 | 50% ♀ / 50% ♂ |
| 117 | Seadra | 1.2 | 25.0 | 50% ♀ / 50% ♂ |
| 118 | Goldeen | 0.6 | 15.0 | 50% ♀ / 50% ♂ |
| 119 | Seaking | 1.3 | 39.0 | 50% ♀ / 50% ♂ |
| 120 | Staryu | 0.8 | 34.5 | Genderless |
| 121 | Starmie | 1.1 | 80.0 | Genderless |
| 122 | Mr. Mime | 1.3 | 54.5 | 50% ♀ / 50% ♂ |
| 123 | Scyther | 1.5 | 56.0 | 50% ♀ / 50% ♂ |
| 124 | Jynx | 1.4 | 40.6 | 100% ♀ |
| 125 | Electabuzz | 1.1 | 30.0 | 25% ♀ / 75% ♂ |
| 126 | Magmar | 1.3 | 44.5 | 25% ♀ / 75% ♂ |
| 127 | Pinsir | 1.5 | 55.0 | 50% ♀ / 50% ♂ |
| 128 | Tauros | 1.4 | 88.4 | 100% ♂ |
| 129 | Magikarp | 0.9 | 10.0 | 50% ♀ / 50% ♂ |
| 130 | Gyarados | 6.5 | 235.0 | 50% ♀ / 50% ♂ |
| 131 | Lapras | 2.5 | 220.0 | 50% ♀ / 50% ♂ |
| 132 | Ditto | 0.3 | 4.0 | Genderless |
| 133 | Eevee | 0.3 | 6.5 | 12.5% ♀ / 87.5% ♂ |
| 134 | Vaporeon | 1.0 | 29.0 | 12.5% ♀ / 87.5% ♂ |
| 135 | Jolteon | 0.8 | 24.5 | 12.5% ♀ / 87.5% ♂ |
| 136 | Flareon | 0.9 | 25.0 | 12.5% ♀ / 87.5% ♂ |
| 137 | Porygon | 0.8 | 36.5 | Genderless |
| 138 | Omanyte | 0.4 | 7.5 | 12.5% ♀ / 87.5% ♂ |
| 139 | Omastar | 1.0 | 35.0 | 12.5% ♀ / 87.5% ♂ |
| 140 | Kabuto | 0.5 | 11.5 | 12.5% ♀ / 87.5% ♂ |
| 141 | Kabutops | 1.3 | 40.5 | 12.5% ♀ / 87.5% ♂ |
| 142 | Aerodactyl | 1.8 | 59.0 | 12.5% ♀ / 87.5% ♂ |
| 143 | Snorlax | 2.1 | 460.0 | 12.5% ♀ / 87.5% ♂ |
| 144 | Articuno | 1.7 | 55.4 | Genderless |
| 145 | Zapdos | 1.6 | 52.6 | Genderless |
| 146 | Moltres | 2.0 | 60.0 | Genderless |
| 147 | Dratini | 1.8 | 3.3 | 50% ♀ / 50% ♂ |
| 148 | Dragonair | 4.0 | 16.5 | 50% ♀ / 50% ♂ |
| 149 | Dragonite | 2.2 | 210.0 | 50% ♀ / 50% ♂ |
| 150 | Mewtwo | 2.0 | 122.0 | Genderless |
| 151 | Mew | 0.4 | 4.0 | Genderless |

---

## Lore Summaries

Short narratives for Pokedex detail popups. Style reference: *Kanto Pokédex – Digital Collectible Edition* (Lore Spotlight). Only lore-focused; no types, abilities, or stats here.

### #039 Jigglypuff

Jigglypuff’s voice can lull almost any listener to sleep. It sings with such purity that travellers and Pokémon alike often doze off mid-song—which only makes this round, balloon-like creature cross. It has a habit of leaning in and marking the faces of those who fell asleep with a marker, as if to say *you missed the encore*. Despite that temper, many in Kanto keep a Jigglypuff as a living lullaby. To befriend one is to walk the line between gentle lullaby and indignant performer.

### #046 Paras

Paras carries a pair of mushrooms on its back from birth. Those mushrooms are parasitic: they draw nutrients from the host, and as Paras grows they grow with it, eventually taking over much of its body by the time it becomes Parasect. In the wild, Paras scrapes tree roots and damp soil for food that feeds both itself and its fungal riders. Forest lore in Kanto often treats Paras as a warning—a creature that is never quite alone in its own skin. To catch a Paras is to hold a life forever shared with the fungus that feeds on it.

### #143 Snorlax

Snorlax spends most of its life asleep. It eats in huge bursts, then sleeps for days or weeks, often in the middle of a path or a valley so that nothing can get by until it wakes. When it does wake, it is usually gentle unless provoked; the real challenge is moving it at all. Villagers in Kanto tell stories of roads and rivers blocked by a single sleeping Snorlax, and of the rare trainer who earns one and gains a friend that doubles as a living wall. To meet a Snorlax is to meet a mountain that dreams.

### #150 Mewtwo

Mewtwo was created in a lab—a clone of the mythical Mew, altered for raw power. It was never given a choice in its own making, and that rage and grief shaped it into one of the most dangerous Pokémon in the world. Its psychic strength is legendary; it can level buildings and bend minds. Yet beneath the fury is a being that never asked to exist. To face Mewtwo is to face the cost of playing creator: a life built for battle, with no one left to answer for the loneliness.

---

## Source

Types match the current type chart as used by [Pokémon Database](https://pokemondb.net) and [PokeAPI](https://pokeapi.co). For Gen 1 species that gained types in later generations (e.g. Clefairy → Fairy, Magnemite → Steel), the **current** types are listed so the in-app Pokédex stays consistent with those references.

## Usage in code

- **Names**: `pokedexStore.js` — `GEN_1_NAMES`
- **Types**: `src/data/gen1PokemonTypes.js` — `GEN_1_POKEMON_TYPES` (id → types array), used by `PokedexModal.jsx` for detail popup type badges (no API).
- **Lore**: `src/data/gen1PokemonLore.js` — `GEN_1_POKEMON_LORE` (id → lore string), used by `PokedexModal.jsx` for the optional “Lore” section in the detail popup. Add entries here as new lore is written in this doc.
- **Physical**: `src/data/gen1PokemonPhysical.js` — `GEN_1_POKEMON_PHYSICAL[id]` → `{ height, weight, genderRatio }` (height in m, weight in kg). Source: PokeAPI CSV (pokemon + pokemon_species).

## Changelog

- **Initial**: All 151 entries with types; Notes column reserved for future per-Pokémon research.
- **Lore**: Added Lore column and Lore Summaries section. First four entries: Jigglypuff (#039), Paras (#046), Snorlax (#143), Mewtwo (#150). Style aligned with *Kanto Pokédex – Digital Collectible Edition* (Lore Spotlight).
- **Physical**: Added height (m), weight (kg), and gender ratio for all 151 from PokeAPI. New section Physical data and `gen1PokemonPhysical.js` for hardcoded reference.
