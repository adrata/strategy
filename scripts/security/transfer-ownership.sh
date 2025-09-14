#!/bin/bash

echo "🔄 TRANSFERRING DATABASE OWNERSHIP"
echo "=================================="
echo ""

# Execute the SQL script to transfer ownership
echo "📝 Executing ownership transfer SQL..."
psql "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require" -f scripts/security/transfer-database-ownership.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Ownership transfer completed successfully!"
    echo ""
    echo "🔍 Verifying new user permissions..."
    
    # Test connection with new user
    psql "postgresql://adrata:npg_F4Y0IJrNUjEv@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require" -c "SELECT current_user, session_user;"
    
    echo ""
    echo "🎉 Database ownership transfer complete!"
    echo "📋 Next steps:"
    echo "1. Test your application with the new user"
    echo "2. If everything works, you can delete the old neondb_owner user"
    echo "3. Update any remaining references to the old user"
else
    echo "❌ Ownership transfer failed!"
    echo "💡 You may need to do this manually in Neon Console"
fi
