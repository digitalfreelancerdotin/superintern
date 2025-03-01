# project overview
Use this guide to build a project where users would be able to register and find interships and have access to a dashbaord where their tasks can be seen. Once they complete the tasks admin can login and sees admin view where the tasks are shown the admin can then review the tasks and give points out of 10. For each intern everyday the total points are calculated and the list of interns on the home page is shown in descending order in a table with names of interns sorted by their total score. Use supabase for managing the db.

# feature requirements
- we will use next.js, shadcn, supabase, Clerk
- A home page with hero section which explains the way this portal works, under the hero section show a list of interns names sorted by their points
- When intern login takes them to intern dashboard where they can see their current and completed tasks and their current score
- When admin logs in show review tasks and add new task, assign new task to intern option

# relevant docs


# current file structure

topinterns/
├── .next/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   │   └── sign-up/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   │   ├── tasks/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   └── intern/
│   │   │       ├── tasks/
│   │   │       │   └── page.tsx
│   │   │       └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   └── [shadcn components]
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── InternTable.tsx
│   │   │   └── Hero.tsx
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   └── utils.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── public/
│   │   └── assets/
│   ├── types/
│   │   └── index.ts
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json

# rules
- All new components should go to the components folder and named like example-component.tsx unless otherwise specified
- All new pages go in /app