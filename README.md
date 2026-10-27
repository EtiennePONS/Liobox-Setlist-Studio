# Setlist Studio

Application React locale pour convertir les exports JSON `.dmf` de GoorooLink en set-lists PDF A4. Aucun serveur de donnees, aucun compte, aucun envoi de fichier. Le fichier original n'est jamais modifie. Les modifications restent en memoire et sont perdues au rechargement.

## Demarrage

Depuis le dossier `app` :

```sh
npm install
npm run dev
```

Ouvrir http://127.0.0.1:1234. Choisir un export `.dmf`, selectionner la set-list, ajuster l'en-tete et les colonnes. L'onglet Morceaux permet de corriger les titres. Telecharger le PDF ou imprimer. Les durees sont interpretees en secondes, a confirmer avec GoorooLink.

## Langues

L'interface et les libelles du PDF sont disponibles en francais, anglais et espagnol. La langue du navigateur est choisie au premier lancement lorsqu'elle est prise en charge ; le selecteur en haut de page permet de la modifier et le choix est conserve dans le navigateur. Les noms de set-lists et de morceaux importes ne sont pas traduits.

Dans En-tete, Ajouter une image importe un logo PNG, JPEG ou WebP (5 Mo maximum). Le cartouche compact place l'image a gauche dans une zone de 34 x 22 mm, proportions conservees, le titre a droite, puis le lieu et la date sur une ligne qui se replie si necessaire. Sans image, le texte occupe toute la largeur. Le titre reste sur une seule ligne : sa taille diminue automatiquement si necessaire, sans depasser les 22 points habituels ni modifier la saisie ou sa casse. Le cartouche figure sur chaque page dans l'apercu, l'impression et le PDF ; un lieu ou sous-titre long augmente sa hauteur sans etre coupe. L'image peut etre remplacee ou retiree avec le bouton corbeille. Sa presence ne reduit plus automatiquement le nombre de morceaux par page.

Le nombre de morceaux et la duree totale figurent sur une ligne dediee dans le cartouche, sous le lieu et la date : titre en premiere ligne, lieu et date en deuxieme ligne, statistiques en troisieme ligne. Si le lieu est long, les statistiques restent sous toutes ses lignes ; sans lieu ni date, elles suivent directement le titre. Il n'y a plus de ligne de statistiques separee au-dessus du tableau ; celui-ci commence 3 mm apres le trait de separation. L'espace de 3 mm sous l'image reste reserve.

Les trois lignes de texte ont un rythme independant du logo. Le titre commence avec un retrait vertical de 1,5 mm ; le lieu/date est centre optiquement entre le bas visible du titre et le haut visible de la troisieme ligne, pour equilibrer les espaces. Les statistiques conservent leur ligne de base et le repere de partie reste fixe a 22 points ; son ajout ne deplace ni les statistiques ni le trait de separation. La marge avant le trait est de 3 mm. Les positions sont calculees en commun pour le PDF, l'apercu et l'impression. L'alignement typographique fin utilise un navigateur recent prenant en charge text-box-trim. Les marges blanches ou transparentes contenues dans le fichier image ne sont pas supprimees.

```sh
npm test
npm run build
```

Le dossier `dist-production` contient la version a heberger sur un serveur statique. Il est separe du dossier `dist` utilise par le serveur de developpement pour eviter les conflits de remplacement de fichiers sous Windows. `npm run build` peut ainsi etre lance pendant que `npm run dev` fonctionne. Parcel est utilise pour le developpement et la compilation, sans Vite. React gere l'interface ; jsPDF et AutoTable generent les PDF cote navigateur.

Le logo est centre dans l'espace compris entre le haut visible du titre et la ligne de base des statistiques. Il ne depasse aucun de ces deux bords et n'est plus lie au centre du lieu/date. Les proportions sont conservees, avec des limites de 34 x 22 mm ; sa hauteur est reduite si necessaire pour tenir dans ce cadre. Les positions des textes, du separateur et du tableau restent inchangees lors de l'import d'une image.

## Parties

Par defaut, la pagination reste automatique. Le bouton Repartir en parties, dans la section Parties, ouvre l'onglet Morceaux. Cocher Nouvelle partie sur un morceau le fait commencer sur une nouvelle page. Par exemple, cocher les morceaux 9 et 11 cree les plages 1-8, 9-10 et 11 jusqu'a la fin. Le premier morceau commence toujours la premiere partie.

Chaque partie garde la numerotation originale des morceaux, repete le cartouche et porte son numero en pied de page. Si elle est trop longue pour une page, elle continue automatiquement sur les suivantes avant le debut de la prochaine partie. L'apercu, l'impression et le PDF utilisent le meme decoupage.

Lorsqu'il y a plusieurs parties, le cartouche affiche aussi Partie 1/3, Partie 2/3, etc. sur la ligne des statistiques, aligne a la marge de droite en Helvetica gras de 22 points fixes. Le repere ne retrecit pas avec un titre de concert long et reste identique sur les pages de continuation d'une partie. Il n'apparait pas lorsqu'il n'y a qu'une seule partie, meme si la pagination automatique produit plusieurs pages.

Decocher une limite fusionne les parties voisines. Le bouton Automatique dans l'editeur retire toutes les limites de la set-list selectionnee sans effacer les corrections de titres. Les limites sont independantes pour chaque set-list et conservees lors des changements de selection, mais perdues au rechargement ou a l'import d'un nouveau fichier. Elles ne modifient jamais le fichier `.dmf` original.

## Limites

- Fichiers de 10 Mo maximum, 100 set-lists maximum, 1000 morceaux par set-list.
- Images : 20 megapixels maximum, 10 000 pixels par cote maximum ; preparation locale en PNG, redimensionne a 1600 pixels maximum par cote. Les fichiers illisibles et les formats actifs comme SVG sont refuses. L'image reste uniquement en memoire jusqu'au rechargement.
- Le schema controle est celui observe dans l'export fourni : `setLists.setList[].tracks`.
- Les titres tronques dans l'export ne sont pas recuperables automatiquement.
- La pagination est calculee par AutoTable selon la hauteur reelle du cartouche, des lignes et des colonnes actives, sans quota de morceaux. L'apercu et l'impression reprennent les memes pages et les memes retours a la ligne que le PDF. Chaque page est remplie avant de passer a la suivante, sans couper un morceau et en reservant les marges et le pied de page.
- Le PDF utilise Helvetica et ses caracteres occidentaux. Les autres alphabets necessiteront une police incorporee.
- Les polices Manrope et Barlow Condensed sont embarquees via Fontsource, avec leurs graisses et caracteres latins accentues. Aucun appel a Google Fonts n'est effectue ; les fichiers WOFF/WOFF2 sont servis localement et inclus dans `dist-production`. Les licences SIL Open Font License sont copiees automatiquement dans `dist-production/licenses` lors de la compilation. Le serveur local et les dependances installees suffisent pour utiliser l'application sans connexion Internet ; cela n'ajoute pas de cache hors ligne a un site heberge distant.
- Pour l'impression du navigateur, desactiver ses en-tetes et pieds de page ; le PDF telecharge est le rendu de reference.

Les donnees importees sont validees avant utilisation et affichees comme texte React, sans injection HTML. Ne pas placer d'exports prives dans un repertoire public de deploiement.