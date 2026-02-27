-- Seed exercise catalog (global) from your Exerices.csv
-- Safe to re-run: it upserts by unique(name)

alter table public.exercise_catalog
add column if not exists note text null;

insert into public.exercise_catalog (name, youtube_url, note)
values
  ('OISEAU AUX HALTERES', 'https://www.youtube.com/shorts/mSMJ3rwYMu0', 'Peut aussi être réalisé assis'),
  ('CABLE FLYS', 'https://www.youtube.com/shorts/bkejPHrPkmA', null),
  ('FACE PULL', 'https://www.youtube.com/shorts/McDrW7uI4JI', 'Travaille aussi beaucoup les trapèzes'),
  ('BARBELL REAR DELT', 'https://youtube.com/clip/Ugkx02ox8YQza272Uz_lL1lDnDtCr6-w_piB?si=CF6kOc26m6OHTgTq', 'Très bon exercice pour éviter de contracter les trapèzes'),
  ('SQUAT BARRE HAUTE', 'https://www.youtube.com/shorts/MLoZuAkIyZI', 'Barre haute signifie plus de travail des quadriceps en général'),
  ('SQUAT BARRE BASSE', 'https://www.youtube.com/watch?v=MF04713ZLmo', 'Barre basse signifie plus de travail fessiers en général'),
  ('HACK SQUAT MACHINE', 'https://www.youtube.com/shorts/vaU2FSmUhNc', 'Excellent pour cibler les quadriceps'),
  ('DEVELOPPÉ INCLINÉ HALTERES', 'https://www.youtube.com/shorts/3rS4I1HKyig', 'Moins de stabilité, plus de liberté de mouvement.'),
  ('DEVELOPPÉ INCLINÉ BARRE', 'https://www.youtube.com/shorts/cq-4gME3IFY', null),
  ('DEVELOPPÉ INCLINÉ SMITH MACHNE', 'https://www.youtube.com/watch?v=8urE8Z8AMQ4', 'Très bonne stabilité, sécurité, et sensations. énorme potentiel de surcharge'),
  ('DEVELOPPÉ INCLINÉ MACHINES', 'https://www.youtube.com/watch?v=0Wa9CfRXUkA', 'Superbe alternative aussi niveau stabilité, sécurité, sensation et potentiel surcharge'),
  ('PRESS VERTICALE A LA BARRE', 'https://www.youtube.com/shorts/DN3WXJlB1Q4', 'Requiert un bon gainage et une bonne stabilité pour progresser.'),
  ('PRESS VERTICALE AUX HALTERES', 'https://www.youtube.com/shorts/Yu4TCmqeJZY', 'Offre plus de stabilité et de liberté de mouvement qu''à la barre'),
  ('PRESS VERTICALE SMITH MACHINE', 'https://www.youtube.com/shorts/QWdaC7rQ-FM', 'Excellente stabilité et grosse possibilité de surcharge'),
  ('PRESS VERTICALE MACHINES', 'https://www.youtube.com/shorts/aj_IQ71TO1o', 'Excellente stabilité et grosse possibilité de surcharge'),
  ('ELEVATIONS LATERALES HALTERES', 'https://www.youtube.com/shorts/67aqcWUYw2I', 'L''enjeu est de ne pas sentir trop les trapezes et de bien sentir la brulure dans les epaules'),
  ('ELEVATIONS LATERALES BANC', 'https://www.youtube.com/watch?v=z3PRz2aVA10', 'L''enjeu est de ne pas sentir trop les trapezes et de bien sentir la brulure dans les epaules'),
  ('ELEVATIONS LATERALES CABLES UNI', 'https://www.youtube.com/watch?v=lq7eLC30b9w', 'Aux cables, on a une tension plus constante qu''aux haltères, une bonne alternative donc, pas indispensable.'),
  ('ELEVATIONS LATERALES CABLES', 'https://www.youtube.com/watch?v=2OMbdPF7mz4', 'Aux cables, on a une tension plus constante qu''aux haltères, une bonne alternative donc, pas indispensable.'),
  ('LEG CURL ASSIS', 'https://www.youtube.com/watch?v=Orxowest56U', 'Assis est mieux que couché selon la science, dépend des préférences et sensations'),
  ('LEG CURL COUCHÉ', 'https://www.youtube.com/watch?v=n5WDXD_mpVY', 'Assis est mieux que couché selon la science, dépend des préférences et sensations'),
  ('LEG EXTENSION', 'https://www.youtube.com/shorts/5tGLgFGDcDE', null),
  ('UNILATERALE EXTENSION MOLLET', 'https://www.youtube.com/shorts/p-uAhWTE8RI', null),
  ('SMITH MACHINE EXTENSION MOLLET', 'https://www.youtube.com/shorts/l9tI_rr6uek', null),
  ('EXTENSION MOLLET ASSIS', 'https://www.youtube.com/shorts/gpXQwBBzRz0', null),
  ('OVERHEAD TRICEPS EXTENSIONS', 'https://www.youtube.com/shorts/Q3bO1Fh4734', 'Excellent exo pour la portion longue des triceps (La plus grosse) peut être réalisé à la barre aussi'),
  ('SKULL CRUSHER AUX HALTERES', 'https://www.youtube.com/shorts/D1y1-sXZDA0', 'Excellent exo pour la portion longue des triceps (La plus grosse) peut être réalisé a la barre aussi'),
  ('EXTENSIONS TRICEPS POULIE HAUTE', 'https://www.youtube.com/shorts/ul1uQunHj1s', 'Excellent exo pour le vaste externe du triceps (La partie externe) Peut être réalisé à la corde aussi'),
  ('SPIDER CURL', 'https://www.youtube.com/shorts/wD8qlC99WvY', 'Super exo pour éviter de "tricher" sur le mouvement et bien sentir le biceps.'),
  ('CURL BARRE EZ', 'https://www.youtube.com/shorts/-BQQSYnhfl0', null),
  ('CURL POULIE BASSE', 'https://www.youtube.com/shorts/XDLhRZhLluE', 'Prendre une barre légèrement en V pour le confort du poignet si besoin, on peut se mettre dos à la poulie, cable entre les jambes pour une courbe de resistance légèrement supérieure.'),
  ('TIRAGE VERTICAL POULIE OU MACHINE', 'https://www.youtube.com/shorts/IcE5c6qf4KE', 'Alternative aux tractions pour ceux qui cherchent pas les tractions ou les femmes. Complément pour les retards dos.'),
  ('TIRAGE HORIZONTAL POULIE', 'https://www.youtube.com/shorts/dYDI15OG9mA', 'Un classique, offre beaucoup de stabilité, permet de se concentrer sur la contraction et l''étirement du haut du dos et des grands dorsaux. Peut être réalisé avec une prise neutre, une barre etc.'),
  ('CHEST SUPPORTED ROW', 'https://www.youtube.com/shorts/xVmflYixQNk', 'Permet d''éviter de tricher avec l''à-coup des lombaires. Certains les trouvent inconfortables car ça appuie sur la cage thoracique'),
  ('ROWING MACHINE', 'https://www.youtube.com/shorts/IT2lbCsxV0U', 'Efficace aussi, je n''aime pas personnellement.'),
  ('ROWING BARRE', 'https://www.instagram.com/p/C3TCeRJMY2C/', 'Un vrai exo pour gagner en puissance globale. demande une stabilisation accrue au niveau des ischios lombaires et abdos'),
  ('FENTES BULGARES', 'https://www.youtube.com/watch?v=hPlKPjohFS0', 'Meilleur exo jambes d''après moi car il travaille énormément les adducteurs et fessiers en plus du reste de la jambe en raison de la demande en stabilisation. On peut le faire avec des haltères dans chaque main ou dans une seule main. On peut également le faire avec le dessus du pieds ou la pointe du pieds sur le support à l''arrière. (Je préfère la pointe) Et on peut se pencher légèrement en avant pour mieux travailler les fessiers et ischios Ou rester bien droit pour mieux travailler les quadriceps.'),
  ('SUMO DEADLIFT', 'https://www.youtube.com/shorts/Fcwh9JwSIro', 'Moins de travail du dos et des ischios, plus de travail fessiers et adducteurs. Potentiel de surcharge progressive aussi important que le conventionnel'),
  ('DEADLIFT ROMANIAN', 'https://www.youtube.com/shorts/ZJtOyVfbEoA', 'Permet de concentrer le travail sur sur les ischios et les fessiers en limitant le travail du dos'),
  ('DEADLIFT CONVENTIONNEL', 'https://www.youtube.com/shorts/vfKwjT5-86k', 'Permet de travailler les ischios, les fessiers, un peu les quadriceps ainsi que le dos.'),
  ('DEADLIFT JAMBE TENDUES', 'https://www.youtube.com/watch?v=CN_7cz3P-1U', 'Met plus l''accent sur les ischios et les fessiers que le conventionnel'),
  ('HIPTRUST BARRE', 'https://www.youtube.com/shorts/NEUUVb39Cik', 'Excellent exercice pour travailler le hip hinge et développer les fessiers'),
  ('HIPTRUST MACHINE', 'https://www.youtube.com/shorts/gDRKP6gZMis', 'Excellent exercice pour travailler le hip hinge et développer les fessiers'),
  ('GLUTE BRIDGE UNILATERAL', 'https://www.youtube.com/watch?v=tiZWu8faIkM', null),
  ('DIPS', 'https://www.youtube.com/shorts/MTWrCC1gTuU', 'Meilleur exercice push au poids de corps pour les pecs, les triceps et les épaules. Potentiel de surcharge monstrueux.'),
  ('TRACTIONS', 'https://www.youtube.com/watch?v=QGSYnup3-u4', 'L''un des exercices les plus difficiles au monde, développant le dos de manière très harmonieuse ainsi que les biceps et les abdos. Je recommande une prise neutre ou une prise supination pour un meilleur recrutement des grands dorsaux et des biceps. Si tu aimes la pronation, alors continue en pronation.'),
  ('TRACTIONS EXCENTRIQUE', 'https://www.youtube.com/watch?v=hvhQXzJ4vhM', 'Le travail en excentrique est supérieur aux machines de tractions assistées et aux tractions à l''élastique pour ceux qui n''arrivent pas encore à faire des tractions. Pour réaliser une série, sauter en haut de la barre afin d''avoir le menton au dessus de celle-ci. Puis maintenir cette position quelques instants le tant de réguler le mouvement de balancier. Puis redescendre au ralenti jusqu''à avoir les bras totalement tendus. Puis répéter plusieurs un maximum de fois sans interruption jusqu''à ne plus réussir à tenir plus de 3secondes.'),
  ('KICK BACK POULIE', 'https://youtube.com/shorts/fuV-vkCZC0A?si=U1zvfrSV6KPT1v8B', 'Exercice isolation fessier'),
  ('HIP ABDUCTION MACHINE', 'https://www.youtube.com/shorts/HngwgIoABFg', 'Exercice isolation fessier'),
  ('BOX STEP UPS', 'https://www.youtube.com/shorts/9day6RhW8XA', 'Un exercice jambe complet avec une belle flexion genoux et hanche. Parfait pour augmenter le volume en variant d''exercice.'),
  ('LEG PRESS', 'https://www.youtube.com/shorts/obqVU1u3Bfk', '- Pour bien sentir les quadriceps, mettre les pieds en bas de la plateforme avec un espacement de la taille des hanches - Pour bien sentir les fessiers, mettre les pieds en haut de la plateforme, avec un espacement légèrement supérieur à la taille des hanches, penser a sortir les genoux vers l''exterieur lorsqu''on pousse et à pousser avec les talons (afin de mieux recruter les fessiers)')
on conflict (name) do update
set
  youtube_url = excluded.youtube_url,
  note = excluded.note;
