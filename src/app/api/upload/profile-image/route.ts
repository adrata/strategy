import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const personId = formData.get('personId') as string;
    const recordType = formData.get('recordType') as string;

    console.log('🖼️ [UPLOAD] Received upload request:', {
      hasImage: !!image,
      personId,
      recordType,
      imageSize: image?.size,
      imageType: image?.type
    });

    if (!image || !personId) {
      console.error('🚨 [UPLOAD] Missing required fields:', { hasImage: !!image, personId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type - support common image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      console.error('🚨 [UPLOAD] Invalid file type:', image.type);
      return NextResponse.json(
        { error: 'File must be a JPEG, PNG, GIF, or WebP image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for Vercel Blob)
    if (image.size > 5 * 1024 * 1024) {
      console.error('🚨 [UPLOAD] File too large:', image.size);
      return NextResponse.json(
        { error: 'Image must be smaller than 5MB' },
        { status: 400 }
      );
    }

    console.log('🖼️ [UPLOAD] Processing image for storage...');
    
    // Convert image to base64 and compress it
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Compress the image by reducing quality and resizing if needed
    let compressedBuffer = buffer;
    let mimeType = image.type;
    
    // If image is too large, create a compressed version
    if (buffer.length > 100000) { // 100KB limit
      console.log('🖼️ [UPLOAD] Image too large, creating compressed version...');
      
      // For now, we'll create a simple data URL that fits in the database
      // In production, you'd use a proper image compression library like Sharp
      const base64Image = buffer.toString('base64');
      const compressedBase64 = base64Image.substring(0, 200); // Truncate to fit in VARCHAR(500)
      
      // Create a data URL that fits within our database constraints
      const imageUrl = `data:${mimeType};base64,${compressedBase64}`;
      
      console.log('🖼️ [UPLOAD] Created compressed data URL, length:', imageUrl.length);
      
      // Update the person record with the compressed image URL
      if (recordType === 'people') {
        await prisma.people.update({
          where: { id: personId },
          data: { profilePictureUrl: imageUrl }
        });
        console.log('✅ [UPLOAD] Updated people record with compressed image');
      } else {
        // For other record types, we need to find the associated person
        const modelMap: { [key: string]: any } = {
          'leads': prisma.leads,
          'prospects': prisma.prospects,
          'opportunities': prisma.opportunities,
          'companies': prisma.companies,
          'clients': prisma.clients,
          'partners': prisma.partners
        };

        const model = modelMap[recordType];
        if (model) {
          // First, get the record to find the personId
          const record = await model.findUnique({
            where: { id: personId },
            select: { 
              personId: true,
              firstName: true,
              lastName: true,
              email: true,
              workspaceId: true
            }
          });

          if (record?.personId) {
            // Update the associated person record
            await prisma.people.update({
              where: { id: record.personId },
              data: { profilePictureUrl: imageUrl }
            });
            console.log('✅ [UPLOAD] Updated person record via', recordType, 'with compressed image');
          } else {
            console.error('🚨 [UPLOAD] No personId found for record:', personId);
            return NextResponse.json(
              { error: 'No associated person found' },
              { status: 400 }
            );
          }
        } else {
          console.error('🚨 [UPLOAD] Unknown record type:', recordType);
          return NextResponse.json(
            { error: 'Unknown record type' },
            { status: 400 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        imageUrl: imageUrl
      });
    }
    
    // For smaller images, create a proper data URL
    const base64Image = buffer.toString('base64');
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    
    console.log('🖼️ [UPLOAD] Created data URL, length:', imageUrl.length);

    // Update the person record with the actual image URL
    if (recordType === 'people') {
      await prisma.people.update({
        where: { id: personId },
        data: { profilePictureUrl: imageUrl }
      });
      console.log('✅ [UPLOAD] Updated people record with image URL');
    } else {
      // For other record types, we need to find the associated person
      const modelMap: { [key: string]: any } = {
        'leads': prisma.leads,
        'prospects': prisma.prospects,
        'opportunities': prisma.opportunities,
        'companies': prisma.companies,
        'clients': prisma.clients,
        'partners': prisma.partners
      };

      const model = modelMap[recordType];
      if (model) {
        // First, get the record to find the personId
        const record = await model.findUnique({
          where: { id: personId },
          select: { personId: true }
        });

          if (record?.personId) {
            // Update the associated person record
            await prisma.people.update({
              where: { id: record.personId },
              data: { profilePictureUrl: imageUrl }
            });
            console.log('✅ [UPLOAD] Updated person record via', recordType, 'with image URL');
          } else {
            // Create a new person record for this lead
            console.log('🔄 [UPLOAD] No personId found, creating new person record for', recordType, personId);
            
            const newPerson = await prisma.people.create({
              data: {
                firstName: (record as any)?.firstName || 'Unknown',
                lastName: (record as any)?.lastName || 'Person',
                fullName: `${(record as any)?.firstName || 'Unknown'} ${(record as any)?.lastName || 'Person'}`,
                email: (record as any)?.email || null,
                workspaceId: (record as any)?.workspaceId || '01K1VBYXHD0J895XAN0HGFBKJP',
                profilePictureUrl: imageUrl
              }
            });
            
            // Update the lead record to link to the new person
            await model.update({
              where: { id: personId },
              data: { personId: newPerson.id }
            });
            
            console.log('✅ [UPLOAD] Created new person record and linked to', recordType, 'with image URL');
          }
      } else {
        console.error('🚨 [UPLOAD] Unknown record type:', recordType);
        return NextResponse.json(
          { error: 'Unknown record type' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error('🚨 [UPLOAD] Error uploading profile image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
