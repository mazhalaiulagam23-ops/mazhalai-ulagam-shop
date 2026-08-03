export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          created_at: string
          failed_count: number
          id: string
          identifier: string
          last_failure_at: string
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          failed_count?: number
          id?: string
          identifier: string
          last_failure_at?: string
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          failed_count?: number
          id?: string
          identifier?: string
          last_failure_at?: string
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_activity_log: {
        Row: {
          action: string
          actor_email: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          id: string
          ip_address: string | null
          module: string
          summary: string
        }
        Insert: {
          action: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          module?: string
          summary?: string
        }
        Update: {
          action?: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          module?: string
          summary?: string
        }
        Relationships: []
      }
      ai_chat_blocks: {
        Row: {
          created_at: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          reason?: string
          user_id: string
        }
        Update: {
          created_at?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_display: {
        Row: {
          accent_color: string
          ai_avatar_url: string | null
          ai_name: string
          business_hours_enabled: boolean
          business_hours_note: string
          created_at: string
          floating_enabled: boolean
          floating_position: string
          id: boolean
          is_enabled: boolean
          live_chat_enabled: boolean
          suggested_questions: string[]
          updated_at: string
          welcome_message: string
          welcome_title: string
        }
        Insert: {
          accent_color?: string
          ai_avatar_url?: string | null
          ai_name?: string
          business_hours_enabled?: boolean
          business_hours_note?: string
          created_at?: string
          floating_enabled?: boolean
          floating_position?: string
          id?: boolean
          is_enabled?: boolean
          live_chat_enabled?: boolean
          suggested_questions?: string[]
          updated_at?: string
          welcome_message?: string
          welcome_title?: string
        }
        Update: {
          accent_color?: string
          ai_avatar_url?: string | null
          ai_name?: string
          business_hours_enabled?: boolean
          business_hours_note?: string
          created_at?: string
          floating_enabled?: boolean
          floating_position?: string
          id?: boolean
          is_enabled?: boolean
          live_chat_enabled?: boolean
          suggested_questions?: string[]
          updated_at?: string
          welcome_message?: string
          welcome_title?: string
        }
        Relationships: []
      }
      ai_chat_settings: {
        Row: {
          auto_reply_enabled: boolean
          created_at: string
          email_notifications: boolean
          id: boolean
          knowledge_notes: string
          rate_limit_per_hour: number
          system_prompt: string
          updated_at: string
          whatsapp_notifications: boolean
        }
        Insert: {
          auto_reply_enabled?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: boolean
          knowledge_notes?: string
          rate_limit_per_hour?: number
          system_prompt?: string
          updated_at?: string
          whatsapp_notifications?: boolean
        }
        Update: {
          auto_reply_enabled?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: boolean
          knowledge_notes?: string
          rate_limit_per_hour?: number
          system_prompt?: string
          updated_at?: string
          whatsapp_notifications?: boolean
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          cta_href: string
          cta_label: string
          eyebrow: string
          id: string
          image_url: string | null
          is_active: boolean
          placement: string
          position: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_href?: string
          cta_label?: string
          eyebrow?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          placement?: string
          position?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_href?: string
          cta_label?: string
          eyebrow?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          placement?: string
          position?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          slug: string
          tagline: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          slug: string
          tagline?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      cookie_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: boolean
          message: string
          policy_href: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: boolean
          message?: string
          policy_href?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: boolean
          message?: string
          policy_href?: string
          updated_at?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          meta: Json
          path: string | null
          source: string
          stack: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          message: string
          meta?: Json
          path?: string | null
          source?: string
          stack?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          meta?: Json
          path?: string | null
          source?: string
          stack?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          position: number
          question: string
          updated_at: string
        }
        Insert: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          created_at: string
          group_name: string
          href: string
          id: string
          is_active: boolean
          label: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_name?: string
          href?: string
          id?: string
          is_active?: boolean
          label: string
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_name?: string
          href?: string
          id?: string
          is_active?: boolean
          label?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      home_sections: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_visible: boolean
          position: number
          section_key: string
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          position?: number
          section_key: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          position?: number
          section_key?: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          method: string
          reason: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          method?: string
          reason?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          method?: string
          reason?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      nav_items: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_visible: boolean
          label: string
          link_type: string
          link_value: string
          open_new_tab: boolean
          parent_id: string | null
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_visible?: boolean
          label?: string
          link_type?: string
          link_value?: string
          open_new_tab?: boolean
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_visible?: boolean
          label?: string
          link_type?: string
          link_value?: string
          open_new_tab?: boolean
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nav_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "nav_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_name: string
          product_slug: string
          qty: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_name: string
          product_slug: string
          qty?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_name?: string
          product_slug?: string
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          city: string
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          order_number: string
          payment_attempts: number
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          pincode: string
          shipping: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_attempts?: number
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pincode: string
          shipping?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_attempts?: number
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pincode?: string
          shipping?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          auto_capture: boolean
          card_enabled: boolean
          checkout_description: string
          checkout_name: string
          cod_enabled: boolean
          cod_max_order: number
          cod_min_order: number
          created_at: string
          currency: string
          id: boolean
          max_retries: number
          mode: string
          netbanking_enabled: boolean
          razorpay_enabled: boolean
          razorpay_key_id_live: string
          razorpay_key_id_test: string
          updated_at: string
          upi_enabled: boolean
          wallet_enabled: boolean
        }
        Insert: {
          auto_capture?: boolean
          card_enabled?: boolean
          checkout_description?: string
          checkout_name?: string
          cod_enabled?: boolean
          cod_max_order?: number
          cod_min_order?: number
          created_at?: string
          currency?: string
          id?: boolean
          max_retries?: number
          mode?: string
          netbanking_enabled?: boolean
          razorpay_enabled?: boolean
          razorpay_key_id_live?: string
          razorpay_key_id_test?: string
          updated_at?: string
          upi_enabled?: boolean
          wallet_enabled?: boolean
        }
        Update: {
          auto_capture?: boolean
          card_enabled?: boolean
          checkout_description?: string
          checkout_name?: string
          cod_enabled?: boolean
          cod_max_order?: number
          cod_min_order?: number
          created_at?: string
          currency?: string
          id?: boolean
          max_retries?: number
          mode?: string
          netbanking_enabled?: boolean
          razorpay_enabled?: boolean
          razorpay_key_id_live?: string
          razorpay_key_id_test?: string
          updated_at?: string
          upi_enabled?: boolean
          wallet_enabled?: boolean
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          attempt: number
          created_at: string
          currency: string
          error_code: string | null
          error_description: string | null
          id: string
          method: string
          mode: string
          order_id: string
          provider: string
          raw: Json
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          attempt?: number
          created_at?: string
          currency?: string
          error_code?: string | null
          error_description?: string | null
          id?: string
          method?: string
          mode?: string
          order_id: string
          provider?: string
          raw?: Json
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          attempt?: number
          created_at?: string
          currency?: string
          error_code?: string | null
          error_description?: string | null
          id?: string
          method?: string
          mode?: string
          order_id?: string
          provider?: string
          raw?: Json
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          age_group: string
          badge: string | null
          barcode: string | null
          brand: string
          care_instructions: string
          category_slug: string
          color: string
          cost_price: number
          cover_image: string | null
          created_at: string
          description: string
          dimensions: string
          discount_percent: number
          gender: string
          gst_percent: number
          hsn_code: string | null
          id: string
          images: string[]
          is_active: boolean
          is_best_seller: boolean
          is_featured: boolean
          is_new_arrival: boolean
          is_trending: boolean
          low_stock_alert: number
          material: string
          mrp: number
          name: string
          offer_price: number | null
          price: number
          seo_description: string
          seo_keywords: string
          seo_title: string
          short_description: string
          size: string
          sku: string | null
          slug: string
          specifications: string
          status: string
          stock: number
          subcategory: string
          tags: string[]
          tax_inclusive: boolean
          unit: string
          updated_at: string
          weight_grams: number
        }
        Insert: {
          age_group?: string
          badge?: string | null
          barcode?: string | null
          brand?: string
          care_instructions?: string
          category_slug: string
          color?: string
          cost_price?: number
          cover_image?: string | null
          created_at?: string
          description?: string
          dimensions?: string
          discount_percent?: number
          gender?: string
          gst_percent?: number
          hsn_code?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_trending?: boolean
          low_stock_alert?: number
          material?: string
          mrp?: number
          name: string
          offer_price?: number | null
          price?: number
          seo_description?: string
          seo_keywords?: string
          seo_title?: string
          short_description?: string
          size?: string
          sku?: string | null
          slug: string
          specifications?: string
          status?: string
          stock?: number
          subcategory?: string
          tags?: string[]
          tax_inclusive?: boolean
          unit?: string
          updated_at?: string
          weight_grams?: number
        }
        Update: {
          age_group?: string
          badge?: string | null
          barcode?: string | null
          brand?: string
          care_instructions?: string
          category_slug?: string
          color?: string
          cost_price?: number
          cover_image?: string | null
          created_at?: string
          description?: string
          dimensions?: string
          discount_percent?: number
          gender?: string
          gst_percent?: number
          hsn_code?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_trending?: boolean
          low_stock_alert?: number
          material?: string
          mrp?: number
          name?: string
          offer_price?: number | null
          price?: number
          seo_description?: string
          seo_keywords?: string
          seo_title?: string
          short_description?: string
          size?: string
          sku?: string | null
          slug?: string
          specifications?: string
          status?: string
          stock?: number
          subcategory?: string
          tags?: string[]
          tax_inclusive?: boolean
          unit?: string
          updated_at?: string
          weight_grams?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_counters: {
        Row: {
          bucket: string
          created_at: string
          hits: number
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          bucket: string
          created_at?: string
          hits?: number
          id?: string
          identifier: string
          window_start: string
        }
        Update: {
          bucket?: string
          created_at?: string
          hits?: number
          id?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_export: boolean
          can_read: boolean
          can_settings: boolean
          can_update: boolean
          created_at: string
          id: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_read?: boolean
          can_settings?: boolean
          can_update?: boolean
          created_at?: string
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_read?: boolean
          can_settings?: boolean
          can_update?: boolean
          created_at?: string
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          admin_ip_allowlist: string[]
          alert_email: string
          captcha_enabled: boolean
          created_at: string
          failed_login_alerts: boolean
          id: boolean
          ip_restriction_enabled: boolean
          lockout_minutes: number
          low_stock_alerts: boolean
          max_failed_attempts: number
          require_2fa_for_admins: boolean
          retention_activity_log_days: number
          retention_error_log_days: number
          retention_login_history_days: number
          session_timeout_minutes: number
          session_warning_seconds: number
          updated_at: string
        }
        Insert: {
          admin_ip_allowlist?: string[]
          alert_email?: string
          captcha_enabled?: boolean
          created_at?: string
          failed_login_alerts?: boolean
          id?: boolean
          ip_restriction_enabled?: boolean
          lockout_minutes?: number
          low_stock_alerts?: boolean
          max_failed_attempts?: number
          require_2fa_for_admins?: boolean
          retention_activity_log_days?: number
          retention_error_log_days?: number
          retention_login_history_days?: number
          session_timeout_minutes?: number
          session_warning_seconds?: number
          updated_at?: string
        }
        Update: {
          admin_ip_allowlist?: string[]
          alert_email?: string
          captcha_enabled?: boolean
          created_at?: string
          failed_login_alerts?: boolean
          id?: boolean
          ip_restriction_enabled?: boolean
          lockout_minutes?: number
          low_stock_alerts?: boolean
          max_failed_attempts?: number
          require_2fa_for_admins?: boolean
          retention_activity_log_days?: number
          retention_error_log_days?: number
          retention_login_history_days?: number
          session_timeout_minutes?: number
          session_warning_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          body_html: string
          created_at: string
          id: string
          is_published: boolean
          seo_description: string
          seo_title: string
          slug: string
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          body_html?: string
          created_at?: string
          id?: string
          is_published?: boolean
          seo_description?: string
          seo_title?: string
          slug: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          created_at?: string
          id?: string
          is_published?: boolean
          seo_description?: string
          seo_title?: string
          slug?: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string
          business_hours: string
          company_name: string
          created_at: string
          email: string
          facebook: string
          favicon_url: string | null
          footer_note: string
          google_maps_url: string
          id: boolean
          instagram: string
          logo_url: string | null
          phone: string
          recaptcha_site_key: string
          site_name: string
          tagline: string
          updated_at: string
          whatsapp: string
          whatsapp_number: string
          youtube: string
        }
        Insert: {
          address?: string
          business_hours?: string
          company_name?: string
          created_at?: string
          email?: string
          facebook?: string
          favicon_url?: string | null
          footer_note?: string
          google_maps_url?: string
          id?: boolean
          instagram?: string
          logo_url?: string | null
          phone?: string
          recaptcha_site_key?: string
          site_name?: string
          tagline?: string
          updated_at?: string
          whatsapp?: string
          whatsapp_number?: string
          youtube?: string
        }
        Update: {
          address?: string
          business_hours?: string
          company_name?: string
          created_at?: string
          email?: string
          facebook?: string
          favicon_url?: string | null
          footer_note?: string
          google_maps_url?: string
          id?: boolean
          instagram?: string
          logo_url?: string | null
          phone?: string
          recaptcha_site_key?: string
          site_name?: string
          tagline?: string
          updated_at?: string
          whatsapp?: string
          whatsapp_number?: string
          youtube?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          label: string
          placements: string[]
          platform: string
          position: number
          qr_image_url: string | null
          show_qr: boolean
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          label?: string
          placements?: string[]
          platform: string
          position?: number
          qr_image_url?: string | null
          show_qr?: boolean
          updated_at?: string
          url?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          label?: string
          placements?: string[]
          platform?: string
          position?: number
          qr_image_url?: string | null
          show_qr?: boolean
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          client_message_id: string | null
          created_at: string
          feedback: number
          id: string
          needs_human: boolean
          parts: Json
          role: string
          user_id: string
        }
        Insert: {
          client_message_id?: string | null
          created_at?: string
          feedback?: number
          id?: string
          needs_human?: boolean
          parts?: Json
          role: string
          user_id: string
        }
        Update: {
          client_message_id?: string | null
          created_at?: string
          feedback?: number
          id?: string
          needs_human?: boolean
          parts?: Json
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          city: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          position: number
          quote: string
          rating: number
          updated_at: string
        }
        Insert: {
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          position?: number
          quote?: string
          rating?: number
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          quote?: string
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          accent_color: string
          animations_enabled: boolean
          background_color: string
          base_radius: number
          body_font: string
          button_style: string
          container_width: number
          created_at: string
          custom_css: string
          dark_mode_enabled: boolean
          foreground_color: string
          heading_font: string
          id: boolean
          preset: string
          primary_color: string
          secondary_color: string
          shadow_style: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          animations_enabled?: boolean
          background_color?: string
          base_radius?: number
          body_font?: string
          button_style?: string
          container_width?: number
          created_at?: string
          custom_css?: string
          dark_mode_enabled?: boolean
          foreground_color?: string
          heading_font?: string
          id?: boolean
          preset?: string
          primary_color?: string
          secondary_color?: string
          shadow_style?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          animations_enabled?: boolean
          background_color?: string
          base_radius?: number
          body_font?: string
          button_style?: string
          container_width?: number
          created_at?: string
          custom_css?: string
          dark_mode_enabled?: boolean
          foreground_color?: string
          heading_font?: string
          id?: boolean
          preset?: string
          primary_color?: string
          secondary_color?: string
          shadow_style?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_2fa: {
        Row: {
          confirmed_at: string | null
          created_at: string
          enabled: boolean
          last_verified_at: string | null
          recovery_codes: string[]
          secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          enabled?: boolean
          last_verified_at?: string | null
          recovery_codes?: string[]
          secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          enabled?: boolean
          last_verified_at?: string | null
          recovery_codes?: string[]
          secret?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_export: boolean
          can_read: boolean
          can_settings: boolean
          can_update: boolean
          created_at: string
          id: string
          module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_read?: boolean
          can_settings?: boolean
          can_update?: boolean
          created_at?: string
          id?: string
          module: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_read?: boolean
          can_settings?: boolean
          can_update?: boolean
          created_at?: string
          id?: string
          module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      payment_config: {
        Row: {
          card_enabled: boolean | null
          cod_enabled: boolean | null
          cod_max_order: number | null
          cod_min_order: number | null
          currency: string | null
          id: boolean | null
          mode: string | null
          netbanking_enabled: boolean | null
          razorpay_enabled: boolean | null
          upi_enabled: boolean | null
          wallet_enabled: boolean | null
        }
        Insert: {
          card_enabled?: boolean | null
          cod_enabled?: boolean | null
          cod_max_order?: number | null
          cod_min_order?: number | null
          currency?: string | null
          id?: boolean | null
          mode?: string | null
          netbanking_enabled?: boolean | null
          razorpay_enabled?: boolean | null
          upi_enabled?: boolean | null
          wallet_enabled?: boolean | null
        }
        Update: {
          card_enabled?: boolean | null
          cod_enabled?: boolean | null
          cod_max_order?: number | null
          cod_min_order?: number | null
          currency?: string | null
          id?: boolean | null
          mode?: string | null
          netbanking_enabled?: boolean | null
          razorpay_enabled?: boolean | null
          upi_enabled?: boolean | null
          wallet_enabled?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_permission: {
        Args: { _action: string; _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer" | "super_admin" | "manager"
      order_status:
        | "pending"
        | "confirmed"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_status:
        | "created"
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "customer", "super_admin", "manager"],
      order_status: [
        "pending",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_status: [
        "created",
        "pending",
        "paid",
        "failed",
        "refunded",
        "cancelled",
      ],
    },
  },
} as const
