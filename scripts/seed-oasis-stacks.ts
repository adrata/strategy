import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Oasis and Stacks data...');

  // Get the first workspace (assuming it exists)
  const workspace = await prisma.workspaces.findFirst();
  if (!workspace) {
    console.log('❌ No workspace found. Please create a workspace first.');
    return;
  }

  console.log(`📁 Using workspace: ${workspace.name} (${workspace.id})`);

  // Get the first user (assuming it exists)
  const user = await prisma.users.findFirst();
  if (!user) {
    console.log('❌ No user found. Please create a user first.');
    return;
  }

  console.log(`👤 Using user: ${user.name} (${user.id})`);

  // Seed Oasis data
  console.log('💬 Creating Oasis channels...');
  
  const generalChannel = await prisma.oasisChannel.upsert({
    where: { id: 'general-channel' },
    update: {},
    create: {
      id: 'general-channel',
      workspaceId: workspace.id,
      name: 'general',
      description: 'General discussion for the team',
      members: {
        create: {
          userId: user.id
        }
      }
    }
  });

  const creativeChannel = await prisma.oasisChannel.upsert({
    where: { id: 'creative-channel' },
    update: {},
    create: {
      id: 'creative-channel',
      workspaceId: workspace.id,
      name: 'creative',
      description: 'Creative ideas, inspiration, and innovative discussions',
      members: {
        create: {
          userId: user.id
        }
      }
    }
  });

  console.log('✅ Created Oasis channels');

  // Add some sample messages
  console.log('💬 Adding sample messages...');
  
  await prisma.oasisMessage.createMany({
    data: [
      {
        content: 'Welcome to the team! 🎉',
        channelId: generalChannel.id,
        senderId: user.id
      },
      {
        content: 'This is our general discussion channel. Feel free to introduce yourself!',
        channelId: generalChannel.id,
        senderId: user.id
      },
      {
        content: 'Anyone up for a coffee break? ☕',
        channelId: creativeChannel.id,
        senderId: user.id
      }
    ]
  });

  console.log('✅ Added sample messages');

  // Seed Stacks data
  console.log('📋 Creating Stacks project...');
  
  const project = await prisma.stacksProject.upsert({
    where: { id: 'sample-project' },
    update: {},
    create: {
      id: 'sample-project',
      workspaceId: workspace.id,
      name: 'Sample Project',
      description: 'A sample project to demonstrate the Stacks functionality'
    }
  });

  console.log('✅ Created sample project');

  // Create sample epic
  console.log('🎯 Creating sample epic...');
  
  const epic = await prisma.stacksEpic.create({
    data: {
      projectId: project.id,
      title: 'User Authentication System',
      description: 'Implement a complete user authentication and authorization system',
      status: 'in-progress',
      priority: 'high'
    }
  });

  console.log('✅ Created sample epic');

  // Create sample stories
  console.log('📖 Creating sample stories...');
  
  const story1 = await prisma.stacksStory.create({
    data: {
      projectId: project.id,
      epicId: epic.id,
      title: 'User Registration',
      description: 'Allow new users to create accounts with email and password',
      status: 'done',
      priority: 'high',
      assigneeId: user.id
    }
  });

  const story2 = await prisma.stacksStory.create({
    data: {
      projectId: project.id,
      epicId: epic.id,
      title: 'User Login',
      description: 'Implement secure login functionality with session management',
      status: 'in-progress',
      priority: 'high',
      assigneeId: user.id
    }
  });

  const story3 = await prisma.stacksStory.create({
    data: {
      projectId: project.id,
      epicId: epic.id,
      title: 'Password Reset',
      description: 'Allow users to reset their passwords via email',
      status: 'todo',
      priority: 'medium'
    }
  });

  console.log('✅ Created sample stories');

  // Create sample tasks
  console.log('✅ Creating sample tasks...');
  
  await prisma.stacksTask.createMany({
    data: [
      {
        projectId: project.id,
        storyId: story1.id,
        title: 'Create registration form',
        description: 'Build the UI form for user registration',
        status: 'done',
        priority: 'high',
        type: 'task',
        assigneeId: user.id
      },
      {
        projectId: project.id,
        storyId: story1.id,
        title: 'Validate email format',
        description: 'Add client and server-side email validation',
        status: 'done',
        priority: 'medium',
        type: 'task',
        assigneeId: user.id
      },
      {
        projectId: project.id,
        storyId: story2.id,
        title: 'Create login form',
        description: 'Build the UI form for user login',
        status: 'in-progress',
        priority: 'high',
        type: 'task',
        assigneeId: user.id
      },
      {
        projectId: project.id,
        storyId: story2.id,
        title: 'Implement JWT tokens',
        description: 'Generate and validate JWT tokens for sessions',
        status: 'todo',
        priority: 'high',
        type: 'task'
      },
      {
        projectId: project.id,
        storyId: story3.id,
        title: 'Design password reset flow',
        description: 'Plan the user experience for password reset',
        status: 'todo',
        priority: 'medium',
        type: 'task'
      },
      {
        projectId: project.id,
        title: 'Fix login button styling',
        description: 'The login button is not properly styled on mobile devices',
        status: 'todo',
        priority: 'low',
        type: 'bug',
        assigneeId: user.id
      },
      {
        projectId: project.id,
        title: 'Registration form validation error',
        description: 'Form shows validation error even when all fields are valid',
        status: 'todo',
        priority: 'medium',
        type: 'bug'
      }
    ]
  });

  console.log('✅ Created sample tasks');

  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Workspace: ${workspace.name}`);
  console.log(`   - User: ${user.name}`);
  console.log(`   - Oasis Channels: 2 (general, creative)`);
  console.log(`   - Sample Messages: 3`);
  console.log(`   - Stacks Project: 1`);
  console.log(`   - Epics: 1`);
  console.log(`   - Stories: 3`);
  console.log(`   - Tasks: 7 (5 tasks, 2 bugs)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
