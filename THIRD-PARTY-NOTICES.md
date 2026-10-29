# Third-party notices

The **source code** of Hán Ngữ Studio is under the MIT License (`LICENSE`).
The **data** it ships (`assets/dictionary/`, `public/data/`) comes from the projects
below and stays under **their** licences, not MIT. Files built from share-alike
data (CC BY-SA) are released under the same licence. The site shows these
credits at `/giay-phep` (English: `/en/giay-phep`).

| Data | Source | Licence | Used for / changes |
|---|---|---|---|
| HSK 3.0 word list | [ivankra/hsk30](https://github.com/ivankra/hsk30) (PRC Ministry of Education list GF 0025-2021), commit `4ff9e39` | MIT (`assets/dictionary/LICENSE-hsk30.txt`) | HSK levels, Pinyin and part of speech → `assets/dictionary/vocab_hsk30.csv`, `public/data/vocab.json` |
| Vietnamese meanings | [CVDICT](https://github.com/ph0ngp/CVDICT) by Phong Phan, commit `c379d90` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (`assets/dictionary/LICENSE-cvdict.txt`) | Meanings of HSK words (first three senses) and measure words (from the classifier notes) → `vocab_hsk30.csv`, `vocab.json`; the whole dictionary (pointer senses resolved, measure words split out, Pinyin in tone marks, Traditional variants merged) → `assets/dictionary/cvdict.tsv`, `public/data/cvdict/` (all CC BY-SA 4.0) |
| English meanings | [CC-CEDICT](https://cc-cedict.org/) (MDBG) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | `assets/dictionary/chinese_dict.csv` → `public/data/meanings.json` (CC BY-SA 4.0) |
| Example sentences | [Tatoeba](https://tatoeba.org/) | [CC BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/) | `assets/dictionary/100000sentences.csv` (with Tatoeba ids) → `public/data/examples/`; Vietnamese translations machine-made with Google Translate and flagged in the UI |
| Character decomposition | [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) `dictionary.txt` | LGPL-3.0-or-later (`assets/dictionary/LICENSE-makemeahanzi-lgpl.txt`) | `public/data/decompose.json` |
| Stroke data | [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) 2.0.1, from Make Me a Hanzi graphics | Arphic Public License (`assets/dictionary/LICENSE-arphic.txt`) | Re-sharded into `public/data/strokes/` |
| Pronunciation | [audio-cmn](https://github.com/hugolpz/audio-cmn) (Yue Tan, Chen Wang, Hugo Lopez) | CC BY-SA (`assets/dictionary/LICENSE-audio-cmn.txt`) | MP3 files packed unchanged into `public/data/audio/` |
| Radicals | [Unicode Unihan](https://www.unicode.org/charts/unihan.html) `kRSUnicode` | [Unicode License v3](https://www.unicode.org/license.txt) (`assets/dictionary/LICENSE-unicode.txt`) | Characters per radical |
| Wubi 86 | [pywubi](https://github.com/mozillazg/pywubi) 0.3.0 | MIT (`assets/dictionary/LICENSE-pywubi.txt`) | `public/data/wubi.json` |
| Hán Việt readings | [hanviet-pinyin-wordlist](https://github.com/ph0ngp/hanviet-pinyin-wordlist) by Phong Phan, commit `b9923df` | MIT (`assets/dictionary/LICENSE-hanviet-pinyin-wordlist.txt`) | `assets/dictionary/char_hanviet.csv` (some readings edited) → `public/data/hanviet.json` |
| Frequency order | [SUBTLEX-CH](https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch): Cai, Q. & Brysbaert, M. (2010). SUBTLEX-CH: Chinese word and character frequencies based on film subtitles. *PLoS ONE* 5(6): e10729 | No licence stated; offered free with a request to cite | Only the **rank order** is kept: the `frequency` column of `char_hanviet.csv` is a rank (higher = more common), and `word_list.txt` is in frequency order. The frequency figures themselves are not redistributed. |
| Segmentation word list | CC-CEDICT headwords | CC BY-SA 4.0 | `assets/dictionary/word_list.txt` → `public/data/word_list.txt`, ordered by SUBTLEX-CH word frequency |

Libraries and fonts bundled into the site (licence texts in each package):
Hanzi Writer 3.7.3 (MIT), pinyin-pro (MIT), opencc-js 1.4.2 (MIT) with OpenCC
dictionaries (Apache-2.0), sql.js 1.12.0 (MIT, SQLite is public domain; its
wasm is copied to `public/data/vendor/` for the Anki .apkg export), fflate 0.8.2
(MIT), Next.js and React (MIT), animateicons (MIT) based on
Lucide (ISC); fonts Be Vietnam Pro, Noto Sans/Serif SC/TC, LXGW WenKai TC and
Ma Shan Zheng (SIL Open Font License 1.1). `pnpm licenses list` prints every
npm dependency with its licence.

Compiled by Hán Ngữ Studio: radical names and meanings (`radicals.tsv`,
checked against PREP's list) and the example sentences with hand-checked
translations (`sentences.tsv`; about 2.5 % are short everyday sentences that
also appear on Tatoeba).
