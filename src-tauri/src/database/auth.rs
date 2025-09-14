use super::models::{AuthUser, AuthWorkspace, DatabaseConnection, HybridDatabaseManager};
use sqlx::{PgPool, SqlitePool, Row};
use bcrypt::verify;

impl HybridDatabaseManager {
    /// PRODUCTION AUTHENTICATION: Query real production database
    pub async fn authenticate_from_production(
        &self,
        postgres: &PgPool,
        _sqlite: &Option<SqlitePool>,
        email: &str,
        password: &str,
    ) -> Result<Option<AuthUser>, Box<dyn std::error::Error + Send + Sync>> {
        println!("🔍 [PRODUCTION] ===== PRODUCTION DATABASE AUTHENTICATION =====");
        println!("🔍 [PRODUCTION] Input email: '{}'", email);
        
        // Support both email and username login
        let is_email = email.contains("@");
        
        println!("🔍 [PRODUCTION] Is email: {}", is_email);
        println!("🔍 [PRODUCTION] Executing database query...");
        
        // SQL QUERY - Support both email and username login
        let query_sql = if is_email {
            r#"
                SELECT u.id, u.name, u.email, u.password
                FROM users u
                WHERE u.email = $1 AND u."isActive" = true
                LIMIT 1
            "#
        } else {
            r#"
                SELECT u.id, u.name, u.email, u.password
                FROM users u
                WHERE u.username = $1 AND u."isActive" = true
                LIMIT 1
            "#
        };
        
        println!("🔍 [PRODUCTION] SQL Query: {}", query_sql);
        println!("🔍 [PRODUCTION] Binding parameters: [{}]", email);
        
        let query_result = sqlx::query(query_sql)
            .bind(&email.to_lowercase())
            .fetch_optional(postgres)
            .await;
        
        println!("🔍 [PRODUCTION] Query executed. Analyzing result...");
        
        match query_result {
            Ok(Some(row)) => {
                println!("✅ [PRODUCTION] User found in database!");
                
                // Extract user fields with detailed logging
                let user_id: String = match row.try_get("id") {
                    Ok(id) => {
                        println!("✅ [PRODUCTION] User ID: {}", id);
                        id
                    }
                    Err(e) => {
                        println!("❌ [PRODUCTION] Failed to get user id: {}", e);
                        return Err(format!("Failed to get user id: {}", e).into());
                    }
                };
                
                let user_name: String = match row.try_get("name") {
                    Ok(name) => {
                        println!("✅ [PRODUCTION] User name: {}", name);
                        name
                    }
                    Err(e) => {
                        println!("❌ [PRODUCTION] Failed to get user name: {}", e);
                        return Err(format!("Failed to get user name: {}", e).into());
                    }
                };
                
                let user_email: String = match row.try_get("email") {
                    Ok(email) => {
                        println!("✅ [PRODUCTION] User email: {}", email);
                        email
                    }
                    Err(e) => {
                        println!("❌ [PRODUCTION] Failed to get user email: {}", e);
                        return Err(format!("Failed to get user email: {}", e).into());
                    }
                };
                
                let stored_hash: String = match row.try_get::<String, _>("password") {
                    Ok(hash) => {
                        println!("✅ [PRODUCTION] Password hash retrieved (length: {})", hash.len());
                        println!("🔍 [PRODUCTION] Hash prefix: {}...", hash.chars().take(10).collect::<String>());
                        hash
                    }
                    Err(e) => {
                        println!("❌ [PRODUCTION] Failed to get password hash: {}", e);
                        return Err(format!("Failed to get password hash: {}", e).into());
                    }
                };
                
                println!("🔐 [PRODUCTION] Verifying password...");
                println!("🔐 [PRODUCTION] Input password length: {}", password.len());
                println!("🔐 [PRODUCTION] Stored hash length: {}", stored_hash.len());
                
                let password_valid = if stored_hash.starts_with("$2") {
                    // Use bcrypt for hashed passwords
                    match verify(password, &stored_hash) {
                        Ok(valid) => {
                            println!("🔐 [PRODUCTION] BCrypt verification completed: {}", valid);
                            valid
                        }
                        Err(e) => {
                            println!("❌ [PRODUCTION] BCrypt verification error: {}", e);
                            false
                        }
                    }
                } else {
                    // For plain text passwords (development only)
                    println!("⚠️ [PRODUCTION] Using plain text comparison (development mode)");
                    password == stored_hash
                };
                
                if password_valid {
                    println!("✅ [PRODUCTION] Password valid. Fetching workspaces...");

                    // Fetch all workspaces for the user
                    let workspace_query = r#"
                        SELECT w.id, w.name, wm.role
                        FROM "WorkspaceMembership" wm
                        JOIN workspaces w ON wm."workspaceId" = w.id
                        WHERE wm."userId" = $1
                    "#;

                    let workspace_rows = sqlx::query(workspace_query)
                        .bind(&user_id)
                        .fetch_all(postgres)
                        .await?;

                    let workspaces: Vec<AuthWorkspace> = workspace_rows.into_iter().map(|r| {
                        AuthWorkspace {
                            id: r.try_get("id").unwrap_or_default(),
                            name: r.try_get("name").unwrap_or_default(),
                            role: r.try_get("role").unwrap_or_default(),
                        }
                    }).collect();

                    if workspaces.is_empty() {
                        println!("❌ [PRODUCTION] User '{}' has no workspace memberships.", user_id);
                        return Ok(None);
                    }

                    println!("✅ [PRODUCTION] Found {} workspaces for user.", workspaces.len());

                    let user = AuthUser {
                        id: user_id,
                        name: user_name,
                        email: user_email,
                        workspaces,
                    };
                    
                    println!("✅ [PRODUCTION] Authentication SUCCESSFUL for: {}", user.name);
                    
                    Ok(Some(user))
                } else {
                    println!("❌ [PRODUCTION] Password verification FAILED for: {}", normalized_email);
                    Ok(None)
                }
            }
            Ok(None) => {
                println!("❌ [PRODUCTION] User NOT FOUND in database: {}", normalized_email);
                println!("❌ [PRODUCTION] Tried to find user with:");
                println!("  - Email match: {}", normalized_email);
                println!("  - Name match: {}", normalized_email);
                println!("  - ID match: {}", normalized_email);
                Ok(None)
            }
            Err(e) => {
                println!("❌ [PRODUCTION] Database query ERROR: {}", e);
                println!("❌ [PRODUCTION] Error type: {:?}", e);
                println!("❌ [PRODUCTION] Query was: {}", query_sql);
                println!("❌ [PRODUCTION] Parameters: [{}]", normalized_email);
                Err(e.into())
            }
        }
    }

    /// Authenticate from SQLite cache (placeholder for future implementation)
    pub async fn authenticate_from_sqlite(
        &self,
        _sqlite: &SqlitePool,
        _email: &str,
        _password: &str,
    ) -> Result<Option<AuthUser>, Box<dyn std::error::Error + Send + Sync>> {
        // This would be implemented if we need SQLite caching
        Ok(None)
    }

    /// Cache user information in SQLite (placeholder for future implementation)
    pub async fn cache_user_in_sqlite(
        &self,
        _sqlite: &SqlitePool,
        _user: &AuthUser,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        // This would be implemented if we need SQLite caching
        Ok(())
    }

    /// Main authentication entry point
    pub async fn authenticate_user(
        &self,
        email: &str,
        password: &str,
    ) -> Result<Option<AuthUser>, Box<dyn std::error::Error + Send + Sync>> {
        println!("🔐 [AUTH] ===== AUTHENTICATION REQUEST =====");
        println!("🔐 [AUTH] Email: {}", email);
        
        let connection = self.connection.read().await;
        
        match &*connection {
            DatabaseConnection::Production { postgres, sqlite } => {
                println!("🔐 [AUTH] Using production database authentication");
                
                // Try production database first
                match self.authenticate_from_production(postgres, sqlite, email, password).await {
                    Ok(Some(user)) => {
                        println!("✅ [AUTH] Production authentication successful");
                        
                        // Cache in SQLite if available
                        if let Some(sqlite_pool) = sqlite {
                            if let Err(e) = self.cache_user_in_sqlite(sqlite_pool, &user).await {
                                println!("⚠️ [AUTH] Failed to cache user in SQLite: {}", e);
                            }
                        }
                        
                        Ok(Some(user))
                    }
                    Ok(None) => {
                        println!("❌ [AUTH] Production authentication failed");
                        
                        // Try SQLite fallback if available
                        if let Some(sqlite_pool) = sqlite {
                            println!("🔐 [AUTH] Trying SQLite fallback...");
                            self.authenticate_from_sqlite(sqlite_pool, email, password).await
                        } else {
                            Ok(None)
                        }
                    }
                    Err(e) => {
                        println!("❌ [AUTH] Production authentication error: {}", e);
                        Err(e)
                    }
                }
            }
            DatabaseConnection::_Hybrid { sqlite } => {
                println!("🔐 [AUTH] Using hybrid database authentication");
                self.authenticate_from_sqlite(sqlite, email, password).await
            }
        }
    }
} 