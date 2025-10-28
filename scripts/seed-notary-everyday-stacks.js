const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedNotaryEverydayStacks() {
  try {
    console.log('🌱 Starting Notary Everyday Stacks seed...');

    // First, find the Notary Everyday workspace
    const notaryWorkspace = await prisma.workspaces.findFirst({
      where: { name: 'Notary Everyday' }
    });

    if (!notaryWorkspace) {
      console.error('❌ Notary Everyday workspace not found. Please create it first.');
      return;
    }

    console.log('✅ Found Notary Everyday workspace:', notaryWorkspace.id);

    // Find Ryan and Dan users
    const ryan = await prisma.users.findFirst({
      where: { email: 'ryan@notaryeveryday.com' }
    });

    const dan = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com' }
    });

    if (!ryan) {
      console.error('❌ Ryan user not found. Please create user first.');
      return;
    }

    console.log('✅ Found Ryan user:', ryan.id);
    if (dan) {
      console.log('✅ Found Dan user:', dan.id);
    }

    // Create the main Notary Everyday project
    const project = await prisma.stacksProject.create({
      data: {
        workspaceId: notaryWorkspace.id,
        name: 'Notary Everyday Revenue Generation',
        description: 'Complete revenue generation system for Notary Everyday with 5 workstreams'
      }
    });

    console.log('✅ Created project:', project.id);

    // Video Epoch (Epic)
    const videoEpic = await prisma.stacksEpic.create({
      data: {
        projectId: project.id,
        title: 'Video Workstream',
        description: 'Video content creation and distribution workstream',
        status: 'in-progress',
        priority: 'high'
      }
    });

    // Video Stories
    const videoStories = [
      { title: 'Podcast - Plan episodes', description: 'Create episode calendar and content planning', status: 'done', priority: 'high' },
      { title: 'Podcast - Record content', description: 'Record podcast episodes with guests', status: 'in-progress', priority: 'high' },
      { title: 'Podcast - Edit and publish', description: 'Edit recorded content and publish to platforms', status: 'up-next', priority: 'medium' },
      { title: 'Homegrown - Create video content', description: 'Produce original video content for marketing', status: 'up-next', priority: 'medium' },
      { title: 'Homegrown - Edit videos', description: 'Edit and polish video content', status: 'up-next', priority: 'medium' },
      { title: 'Homegrown - Publish to channels', description: 'Distribute videos across all platforms', status: 'up-next', priority: 'low' },
      { title: 'Commercial/Promo - Script writing', description: 'Write scripts for commercial content', status: 'up-next', priority: 'medium' },
      { title: 'Commercial/Promo - Video production', description: 'Produce commercial video content', status: 'up-next', priority: 'medium' },
      { title: 'Commercial/Promo - Distribution', description: 'Distribute commercial content to platforms', status: 'up-next', priority: 'low' },
      { title: 'Testimonial - Collect testimonials', description: 'Gather customer testimonials and feedback', status: 'up-next', priority: 'high' },
      { title: 'Testimonial - Edit footage', description: 'Edit testimonial video footage', status: 'up-next', priority: 'medium' },
      { title: 'Testimonial - Publish', description: 'Publish testimonial videos', status: 'up-next', priority: 'medium' },
      { title: 'MVP - Define MVP features', description: 'Define core features for video platform MVP', status: 'in-progress', priority: 'urgent' },
      { title: 'MVP - Build MVP', description: 'Develop the video platform MVP', status: 'up-next', priority: 'urgent' },
      { title: 'MVP - Test and iterate', description: 'Test MVP and iterate based on feedback', status: 'up-next', priority: 'high' },
      { title: 'Demos - Create demo scripts', description: 'Write scripts for product demonstrations', status: 'up-next', priority: 'medium' },
      { title: 'Demos - Record demos', description: 'Record product demonstration videos', status: 'up-next', priority: 'medium' },
      { title: 'Demos - Share with prospects', description: 'Distribute demo videos to prospects', status: 'up-next', priority: 'low' },
      { title: 'IEP Roadmap - Define roadmap', description: 'Define IEP roadmap and milestones', status: 'up-next', priority: 'low' },
      { title: 'IEP Roadmap - Prioritize features', description: 'Prioritize features for IEP implementation', status: 'up-next', priority: 'low' },
      { title: 'IEP Roadmap - Execute plan', description: 'Execute IEP roadmap implementation', status: 'up-next', priority: 'low' }
    ];

    for (const story of videoStories) {
      await prisma.stacksStory.create({
        data: {
          projectId: project.id,
          epicId: videoEpic.id,
          title: story.title,
          description: story.description,
          status: story.status,
          priority: story.priority,
          assigneeId: ryan.id
        }
      });
    }

    // Cold Epoch (Epic) - Work with Dan
    const coldEpic = await prisma.stacksEpic.create({
      data: {
        projectId: project.id,
        title: 'Cold Workstream',
        description: 'Cold outreach and lead generation workstream',
        status: 'in-progress',
        priority: 'high'
      }
    });

    // Cold Stories
    const coldStories = [
      { title: 'Cold Outreach - Build prospect list', description: 'Build comprehensive prospect list for cold outreach', status: 'in-progress', priority: 'high' },
      { title: 'Cold Outreach - Create email templates', description: 'Create effective cold email templates', status: 'up-next', priority: 'high' },
      { title: 'Cold Outreach - Execute outreach campaign', description: 'Execute cold outreach campaign', status: 'up-next', priority: 'high' },
      { title: 'Emails - Write email copy', description: 'Write compelling email copy for campaigns', status: 'up-next', priority: 'medium' },
      { title: 'Emails - Set up sequences', description: 'Set up automated email sequences', status: 'up-next', priority: 'medium' },
      { title: 'Emails - Track responses', description: 'Track and analyze email response rates', status: 'up-next', priority: 'low' },
      { title: 'Tech/SMS - Set up SMS platform', description: 'Set up SMS platform for outreach', status: 'up-next', priority: 'medium' },
      { title: 'Tech/SMS - Create SMS templates', description: 'Create SMS message templates', status: 'up-next', priority: 'medium' },
      { title: 'Tech/SMS - Launch SMS campaign', description: 'Launch SMS outreach campaign', status: 'up-next', priority: 'low' }
    ];

    for (const story of coldStories) {
      await prisma.stacksStory.create({
        data: {
          projectId: project.id,
          epicId: coldEpic.id,
          title: story.title,
          description: story.description,
          status: story.status,
          priority: story.priority,
          assigneeId: ryan.id
        }
      });
    }

    // Referral Epoch (Epic)
    const referralEpic = await prisma.stacksEpic.create({
      data: {
        projectId: project.id,
        title: 'Referral Workstream',
        description: 'Referral and relationship building workstream',
        status: 'up-next',
        priority: 'medium'
      }
    });

    // Referral Stories
    const referralStories = [
      { title: 'Meet for Coffee - Schedule meetings', description: 'Schedule coffee meetings with prospects', status: 'up-next', priority: 'medium' },
      { title: 'Meet for Coffee - Prepare talking points', description: 'Prepare talking points for coffee meetings', status: 'up-next', priority: 'medium' },
      { title: 'Meet for Coffee - Follow up', description: 'Follow up after coffee meetings', status: 'up-next', priority: 'low' },
      { title: 'SMS Drip Campaign - Plan drip sequence', description: 'Plan SMS drip campaign sequence', status: 'up-next', priority: 'medium' },
      { title: 'SMS Drip Campaign - Write SMS content', description: 'Write SMS content for drip campaign', status: 'up-next', priority: 'medium' },
      { title: 'SMS Drip Campaign - Launch campaign', description: 'Launch SMS drip campaign', status: 'up-next', priority: 'low' },
      { title: 'Email Drip - Design email flow', description: 'Design email drip campaign flow', status: 'up-next', priority: 'medium' },
      { title: 'Email Drip - Write email content', description: 'Write email content for drip campaign', status: 'up-next', priority: 'medium' },
      { title: 'Email Drip - Set up automation', description: 'Set up email automation system', status: 'up-next', priority: 'low' },
      { title: 'Leisure - Plan leisure activities', description: 'Plan leisure activities for prospects', status: 'up-next', priority: 'low' },
      { title: 'Leisure - Invite prospects', description: 'Invite prospects to leisure activities', status: 'up-next', priority: 'low' },
      { title: 'Leisure - Follow up', description: 'Follow up after leisure activities', status: 'up-next', priority: 'low' }
    ];

    for (const story of referralStories) {
      await prisma.stacksStory.create({
        data: {
          projectId: project.id,
          epicId: referralEpic.id,
          title: story.title,
          description: story.description,
          status: story.status,
          priority: story.priority,
          assigneeId: ryan.id
        }
      });
    }

    // Events Epoch (Epic)
    const eventsEpic = await prisma.stacksEpic.create({
      data: {
        projectId: project.id,
        title: 'Events Workstream',
        description: 'Events and networking workstream',
        status: 'up-next',
        priority: 'medium'
      }
    });

    // Events Stories
    const eventsStories = [
      { title: 'Powered by (Dealer Demo) - Plan event', description: 'Plan dealer demonstration event', status: 'up-next', priority: 'high' },
      { title: 'Powered by (Dealer Demo) - Invite attendees', description: 'Invite attendees to dealer demo', status: 'up-next', priority: 'high' },
      { title: 'Powered by (Dealer Demo) - Execute event', description: 'Execute dealer demonstration event', status: 'up-next', priority: 'high' },
      { title: 'Powered by (Dealer Demo) - Follow up', description: 'Follow up after dealer demo', status: 'up-next', priority: 'medium' },
      { title: 'Industry Events - Research events', description: 'Research relevant industry events', status: 'up-next', priority: 'medium' },
      { title: 'Industry Events - Register/sponsor', description: 'Register for or sponsor industry events', status: 'up-next', priority: 'medium' },
      { title: 'Industry Events - Attend and network', description: 'Attend events and network with attendees', status: 'up-next', priority: 'medium' },
      { title: 'National Event (Lexington Title) - Plan national event', description: 'Plan national event with Lexington Title', status: 'up-next', priority: 'high' },
      { title: 'National Event (Lexington Title) - Coordinate logistics', description: 'Coordinate logistics for national event', status: 'up-next', priority: 'high' },
      { title: 'National Event (Lexington Title) - Execute event', description: 'Execute national event', status: 'up-next', priority: 'high' }
    ];

    for (const story of eventsStories) {
      await prisma.stacksStory.create({
        data: {
          projectId: project.id,
          epicId: eventsEpic.id,
          title: story.title,
          description: story.description,
          status: story.status,
          priority: story.priority,
          assigneeId: ryan.id
        }
      });
    }

    // Social Epoch (Epic)
    const socialEpic = await prisma.stacksEpic.create({
      data: {
        projectId: project.id,
        title: 'Social Workstream',
        description: 'Social media and content marketing workstream',
        status: 'up-next',
        priority: 'medium'
      }
    });

    // Social Stories
    const socialStories = [
      { title: 'Podcast - Plan episodes', description: 'Plan social media podcast episodes', status: 'up-next', priority: 'medium' },
      { title: 'Podcast - Record', description: 'Record social media podcast content', status: 'up-next', priority: 'medium' },
      { title: 'Podcast - Promote', description: 'Promote podcast on social media', status: 'up-next', priority: 'low' },
      { title: 'Reports - Create report templates', description: 'Create social media report templates', status: 'up-next', priority: 'medium' },
      { title: 'Reports - Generate reports', description: 'Generate social media reports', status: 'up-next', priority: 'medium' },
      { title: 'Reports - Share insights', description: 'Share report insights with team', status: 'up-next', priority: 'low' },
      { title: 'Social Comp (LinkedIn, Instagram, TikTok) - Create content calendar', description: 'Create social media content calendar', status: 'up-next', priority: 'medium' },
      { title: 'Social Comp (LinkedIn, Instagram, TikTok) - Design posts', description: 'Design social media posts', status: 'up-next', priority: 'medium' },
      { title: 'Social Comp (LinkedIn, Instagram, TikTok) - Schedule and publish', description: 'Schedule and publish social media content', status: 'up-next', priority: 'low' },
      { title: 'Sentence Builder - Build sentence templates', description: 'Build sentence templates for content', status: 'up-next', priority: 'low' },
      { title: 'Sentence Builder - Test with users', description: 'Test sentence builder with users', status: 'up-next', priority: 'low' },
      { title: 'Sentence Builder - Refine', description: 'Refine sentence builder based on feedback', status: 'up-next', priority: 'low' }
    ];

    for (const story of socialStories) {
      await prisma.stacksStory.create({
        data: {
          projectId: project.id,
          epicId: socialEpic.id,
          title: story.title,
          description: story.description,
          status: story.status,
          priority: story.priority,
          assigneeId: ryan.id
        }
      });
    }

    console.log('✅ Successfully seeded Notary Everyday Stacks data!');
    console.log('📊 Created:');
    console.log('  - 1 Project');
    console.log('  - 5 Epics (Workstreams)');
    console.log('  - 60+ Stories');

  } catch (error) {
    console.error('❌ Error seeding Notary Everyday Stacks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNotaryEverydayStacks();
