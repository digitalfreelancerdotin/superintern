# project overview
Use this guide to build a project where users would be able to register and find interships and have access to a dashbaord where their tasks can be seen. Once they complete the tasks admin can login and sees admin view where the tasks are shown the admin can then review the tasks and give points out of 10. For each intern everyday the total points are calculated and the list of interns on the home page is shown in descending order in a table with names of interns sorted by their total score. Use supabase for managing the db.

# feature requirements
- we will use next.js, shadcn, supabase, Clerk
- A home page with hero section which explains the way this portal works, under the hero section show a list of interns names sorted by their points
- When intern login takes them to intern dashboard where they can see their current and completed tasks and their current score
- When admin logs in show review tasks and add new task, assign new task to intern option

# relevant docs


# current file structure

superinterns4/
├── .next/
├── .git/
├── app/
│   ├── actions/
│   ├── api/
│   ├── auth/
│   ├── components/
│   ├── context/
│   ├── dashboard/
│   ├── lib/
│   ├── login/
│   ├── signup/
│   ├── globals.css
│   ├── layout.tsx
│   ├── middleware.ts
│   ├── page.tsx
│   └── favicon.ico
├── components/
├── lib/
├── migrations/
├── public/
├── requirements/
├── supabase/
├── node_modules/
├── .env.local
├── .eslintrc.json
├── .gitignore
├── components.json
├── eslint.config.mjs
├── middleware.ts
├── next.config.js
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
├── restart.dev.bat
├── tailwind.config.js
├── tsconfig.json
└── various SQL files
    ├── working.sqll
    ├── update-open-tasks-policy.sql
    ├── update-tasks-table.sql
    ├── tasklist.sql
    └── ... (other SQL files)

# rules
- All new components should go to the components folder and named like example-component.tsx unless otherwise specified
- All new pages go in /app