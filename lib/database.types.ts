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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      acquisitions: {
        Row: {
          acquired_from_contact_id: string | null
          acquisition_date: string | null
          acquisition_discount: number | null
          acquisition_price: number | null
          acquisition_subject: string | null
          acquisition_type: string | null
          base_currency: string | null
          bought_by_contact_id: string | null
          buyer_premium: number | null
          created_at: string
          currency: string
          exchange_rate: number | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          notes: string | null
          taxes: number | null
          total_cost: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          acquired_from_contact_id?: string | null
          acquisition_date?: string | null
          acquisition_discount?: number | null
          acquisition_price?: number | null
          acquisition_subject?: string | null
          acquisition_type?: string | null
          base_currency?: string | null
          bought_by_contact_id?: string | null
          buyer_premium?: number | null
          created_at?: string
          currency?: string
          exchange_rate?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          taxes?: number | null
          total_cost?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          acquired_from_contact_id?: string | null
          acquisition_date?: string | null
          acquisition_discount?: number | null
          acquisition_price?: number | null
          acquisition_subject?: string | null
          acquisition_type?: string | null
          base_currency?: string | null
          bought_by_contact_id?: string | null
          buyer_premium?: number | null
          created_at?: string
          currency?: string
          exchange_rate?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          taxes?: number | null
          total_cost?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acquisitions_acquired_from_contact_id_fkey"
            columns: ["acquired_from_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquisitions_bought_by_contact_id_fkey"
            columns: ["bought_by_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquisitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          aka: string | null
          bio: string | null
          birth_year: number | null
          company: string | null
          created_at: string
          death_year: number | null
          first_name: string | null
          id: string
          last_name: string | null
          nationality: string | null
          r2_headshot_key: string | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          aka?: string | null
          bio?: string | null
          birth_year?: number | null
          company?: string | null
          created_at?: string
          death_year?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          nationality?: string | null
          r2_headshot_key?: string | null
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          aka?: string | null
          bio?: string | null
          birth_year?: number | null
          company?: string | null
          created_at?: string
          death_year?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          nationality?: string | null
          r2_headshot_key?: string | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_reports: {
        Row: {
          context: string | null
          created_at: string
          examiner_contact_id: string | null
          findings: Json
          id: string
          loan_id: string | null
          object_id: string
          overall_rating: string | null
          report_date: string
          summary: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          examiner_contact_id?: string | null
          findings?: Json
          id?: string
          loan_id?: string | null
          object_id: string
          overall_rating?: string | null
          report_date: string
          summary?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          examiner_contact_id?: string | null
          findings?: Json
          id?: string
          loan_id?: string | null
          object_id?: string
          overall_rating?: string | null
          report_date?: string
          summary?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condition_reports_examiner_contact_id_fkey"
            columns: ["examiner_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_reports_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_reports_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conservation_treatments: {
        Row: {
          conservator_contact_id: string | null
          cost: number | null
          created_at: string
          currency: string
          description: string | null
          end_date: string | null
          id: string
          object_id: string
          start_date: string | null
          treatment_type: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          conservator_contact_id?: string | null
          cost?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          id?: string
          object_id: string
          start_date?: string | null
          treatment_type?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          conservator_contact_id?: string | null
          cost?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          id?: string
          object_id?: string
          start_date?: string | null
          treatment_type?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conservation_treatments_conservator_contact_id_fkey"
            columns: ["conservator_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conservation_treatments_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conservation_treatments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      consignments: {
        Row: {
          commission_pct: number | null
          consignee_contact_id: string | null
          consignor_contact_id: string | null
          created_at: string
          direction: string
          end_date: string | null
          id: string
          start_date: string | null
          status: string
          terms: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          commission_pct?: number | null
          consignee_contact_id?: string | null
          consignor_contact_id?: string | null
          created_at?: string
          direction: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          terms?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          commission_pct?: number | null
          consignee_contact_id?: string | null
          consignor_contact_id?: string | null
          created_at?: string
          direction?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          terms?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consignments_consignee_contact_id_fkey"
            columns: ["consignee_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignments_consignor_contact_id_fkey"
            columns: ["consignor_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string | null
          contact_type: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          mobile: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          contact_type?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          contact_type?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string
          entity_type: string
          field_type: string
          id: string
          key: string
          label: string
          options: Json | null
          sort_order: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          field_type: string
          id?: string
          key: string
          label: string
          options?: Json | null
          sort_order?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          field_type?: string
          id?: string
          key?: string
          label?: string
          options?: Json | null
          sort_order?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      disposals: {
        Row: {
          commission: number | null
          created_at: string
          currency: string
          disposal_date: string | null
          disposal_type: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          notes: string | null
          recipient_contact_id: string | null
          total_proceeds: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          commission?: number | null
          created_at?: string
          currency?: string
          disposal_date?: string | null
          disposal_type: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          recipient_contact_id?: string | null
          total_proceeds?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          commission?: number | null
          created_at?: string
          currency?: string
          disposal_date?: string | null
          disposal_type?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          recipient_contact_id?: string | null
          total_proceeds?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disposals_recipient_contact_id_fkey"
            columns: ["recipient_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disposals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          document_date: string | null
          document_name: string
          document_type: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          original_filename: string | null
          r2_key: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_date?: string | null
          document_name: string
          document_type?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          r2_key: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_date?: string | null
          document_name?: string
          document_type?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          r2_key?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_documents: {
        Row: {
          created_at: string
          document_id: string | null
          entity_id: string
          entity_type: string
          id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          entity_id: string
          entity_type: string
          id?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibitions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
          title: string
          type: string | null
          updated_at: string
          venue_contact_id: string | null
          venue_name: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          title: string
          type?: string | null
          updated_at?: string
          venue_contact_id?: string | null
          venue_name?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          venue_contact_id?: string | null
          venue_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibitions_venue_contact_id_fkey"
            columns: ["venue_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number | null
          conservation_treatment_id: string | null
          created_at: string
          currency: string
          description: string | null
          expense_date: string | null
          expense_type: string | null
          id: string
          invoice_number: string | null
          object_id: string | null
          shipment_id: string | null
          vendor_contact_id: string | null
          workspace_id: string
        }
        Insert: {
          amount?: number | null
          conservation_treatment_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string | null
          expense_type?: string | null
          id?: string
          invoice_number?: string | null
          object_id?: string | null
          shipment_id?: string | null
          vendor_contact_id?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number | null
          conservation_treatment_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string | null
          expense_type?: string | null
          id?: string
          invoice_number?: string | null
          object_id?: string | null
          shipment_id?: string | null
          vendor_contact_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_conservation_treatment_id_fkey"
            columns: ["conservation_treatment_id"]
            isOneToOne: false
            referencedRelation: "conservation_treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vendor_contact_id_fkey"
            columns: ["vendor_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          coverage_type: string | null
          created_at: string
          currency: string
          deductible: number | null
          end_date: string | null
          id: string
          insurer_contact_id: string | null
          is_active: boolean
          notes: string | null
          policy_number: string | null
          policy_subject: string | null
          premium: number | null
          start_date: string | null
          total_coverage: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          coverage_type?: string | null
          created_at?: string
          currency?: string
          deductible?: number | null
          end_date?: string | null
          id?: string
          insurer_contact_id?: string | null
          is_active?: boolean
          notes?: string | null
          policy_number?: string | null
          policy_subject?: string | null
          premium?: number | null
          start_date?: string | null
          total_coverage?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          coverage_type?: string | null
          created_at?: string
          currency?: string
          deductible?: number | null
          end_date?: string | null
          id?: string
          insurer_contact_id?: string | null
          is_active?: boolean
          notes?: string | null
          policy_number?: string | null
          policy_subject?: string | null
          premium?: number | null
          start_date?: string | null
          total_coverage?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_insurer_contact_id_fkey"
            columns: ["insurer_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          actual_return_date: string | null
          borrower_contact_id: string | null
          created_at: string
          currency: string
          direction: string | null
          end_date: string | null
          exhibition_name: string | null
          id: string
          insurance_policy_id: string | null
          insurance_value: number | null
          lender_contact_id: string | null
          loan_subject: string | null
          notes: string | null
          start_date: string | null
          status: string
          updated_at: string
          venue: string | null
          workspace_id: string
        }
        Insert: {
          actual_return_date?: string | null
          borrower_contact_id?: string | null
          created_at?: string
          currency?: string
          direction?: string | null
          end_date?: string | null
          exhibition_name?: string | null
          id?: string
          insurance_policy_id?: string | null
          insurance_value?: number | null
          lender_contact_id?: string | null
          loan_subject?: string | null
          notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
          workspace_id: string
        }
        Update: {
          actual_return_date?: string | null
          borrower_contact_id?: string | null
          created_at?: string
          currency?: string
          direction?: string | null
          end_date?: string | null
          exhibition_name?: string | null
          id?: string
          insurance_policy_id?: string | null
          insurance_value?: number | null
          lender_contact_id?: string | null
          loan_subject?: string | null
          notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_borrower_contact_id_fkey"
            columns: ["borrower_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_insurance_policy_id_fkey"
            columns: ["insurance_policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_lender_contact_id_fkey"
            columns: ["lender_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          postal_code: string | null
          state: string | null
          type: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          postal_code?: string | null
          state?: string | null
          type?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          postal_code?: string | null
          state?: string | null
          type?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_acquisitions: {
        Row: {
          acquisition_id: string
          buyer_premium: number | null
          created_at: string
          discount: number | null
          lot_number: string | null
          object_id: string
          object_price: number | null
          taxes: number | null
          workspace_id: string
        }
        Insert: {
          acquisition_id: string
          buyer_premium?: number | null
          created_at?: string
          discount?: number | null
          lot_number?: string | null
          object_id: string
          object_price?: number | null
          taxes?: number | null
          workspace_id: string
        }
        Update: {
          acquisition_id?: string
          buyer_premium?: number | null
          created_at?: string
          discount?: number | null
          lot_number?: string | null
          object_id?: string
          object_price?: number | null
          taxes?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_acquisitions_acquisition_id_fkey"
            columns: ["acquisition_id"]
            isOneToOne: false
            referencedRelation: "acquisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_acquisitions_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_acquisitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_components: {
        Row: {
          condition_notes: string | null
          created_at: string
          description: string | null
          dimensions_text: string | null
          id: string
          name: string
          object_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          condition_notes?: string | null
          created_at?: string
          description?: string | null
          dimensions_text?: string | null
          id?: string
          name: string
          object_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          condition_notes?: string | null
          created_at?: string
          description?: string | null
          dimensions_text?: string | null
          id?: string
          name?: string
          object_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_components_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_components_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_consignments: {
        Row: {
          asking_price: number | null
          consignment_id: string
          created_at: string
          object_id: string
          status: string | null
          workspace_id: string
        }
        Insert: {
          asking_price?: number | null
          consignment_id: string
          created_at?: string
          object_id: string
          status?: string | null
          workspace_id: string
        }
        Update: {
          asking_price?: number | null
          consignment_id?: string
          created_at?: string
          object_id?: string
          status?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_consignments_consignment_id_fkey"
            columns: ["consignment_id"]
            isOneToOne: false
            referencedRelation: "consignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_consignments_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_consignments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_dimensions: {
        Row: {
          created_at: string
          depth: number | null
          height: number | null
          id: string
          object_id: string
          type: string
          unit: string
          width: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          depth?: number | null
          height?: number | null
          id?: string
          object_id: string
          type?: string
          unit?: string
          width?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          depth?: number | null
          height?: number | null
          id?: string
          object_id?: string
          type?: string
          unit?: string
          width?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_dimensions_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_dimensions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_disposals: {
        Row: {
          commission: number | null
          created_at: string
          disposal_id: string
          object_id: string
          sale_price: number | null
          workspace_id: string
        }
        Insert: {
          commission?: number | null
          created_at?: string
          disposal_id: string
          object_id: string
          sale_price?: number | null
          workspace_id: string
        }
        Update: {
          commission?: number | null
          created_at?: string
          disposal_id?: string
          object_id?: string
          sale_price?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_disposals_disposal_id_fkey"
            columns: ["disposal_id"]
            isOneToOne: false
            referencedRelation: "disposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_disposals_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_disposals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_exhibitions: {
        Row: {
          catalogue_number: string | null
          created_at: string
          exhibition_id: string
          notes: string | null
          object_id: string
          workspace_id: string
        }
        Insert: {
          catalogue_number?: string | null
          created_at?: string
          exhibition_id: string
          notes?: string | null
          object_id: string
          workspace_id: string
        }
        Update: {
          catalogue_number?: string | null
          created_at?: string
          exhibition_id?: string
          notes?: string | null
          object_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_exhibitions_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_exhibitions_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_exhibitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_groups: {
        Row: {
          group_id: string
          object_id: string
          workspace_id: string
        }
        Insert: {
          group_id: string
          object_id: string
          workspace_id: string
        }
        Update: {
          group_id?: string
          object_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_groups_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_groups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_insurance: {
        Row: {
          insured_value: number | null
          object_id: string
          policy_id: string
          workspace_id: string
        }
        Insert: {
          insured_value?: number | null
          object_id: string
          policy_id: string
          workspace_id: string
        }
        Update: {
          insured_value?: number | null
          object_id?: string
          policy_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_insurance_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_insurance_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_insurance_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_loans: {
        Row: {
          condition_in: string | null
          condition_out: string | null
          loan_id: string
          loan_value: number | null
          object_id: string
          workspace_id: string
        }
        Insert: {
          condition_in?: string | null
          condition_out?: string | null
          loan_id: string
          loan_value?: number | null
          object_id: string
          workspace_id: string
        }
        Update: {
          condition_in?: string | null
          condition_out?: string | null
          loan_id?: string
          loan_value?: number | null
          object_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_loans_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_loans_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_loans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_media: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_primary: boolean
          name: string | null
          object_id: string
          r2_key_medium: string | null
          r2_key_original: string
          r2_key_thumbnail: string | null
          type: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean
          name?: string | null
          object_id: string
          r2_key_medium?: string | null
          r2_key_original: string
          r2_key_thumbnail?: string | null
          type: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean
          name?: string | null
          object_id?: string
          r2_key_medium?: string | null
          r2_key_original?: string
          r2_key_thumbnail?: string | null
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_media_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_media_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_publications: {
        Row: {
          created_at: string
          object_id: string
          publication_id: string
          reference: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          object_id: string
          publication_id: string
          reference?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          object_id?: string
          publication_id?: string
          reference?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_publications_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_publications_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_publications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_shipments: {
        Row: {
          created_at: string
          object_id: string
          shipment_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          object_id: string
          shipment_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          object_id?: string
          shipment_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_shipments_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_shipments_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_shipments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      object_valuations: {
        Row: {
          appraised_value: number | null
          created_at: string
          high_estimate: number | null
          id: string
          low_estimate: number | null
          notes: string | null
          object_id: string | null
          valuation_id: string | null
          workspace_id: string
        }
        Insert: {
          appraised_value?: number | null
          created_at?: string
          high_estimate?: number | null
          id?: string
          low_estimate?: number | null
          notes?: string | null
          object_id?: string | null
          valuation_id?: string | null
          workspace_id: string
        }
        Update: {
          appraised_value?: number | null
          created_at?: string
          high_estimate?: number | null
          id?: string
          low_estimate?: number | null
          notes?: string | null
          object_id?: string | null
          valuation_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_valuations_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_valuations_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_valuations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      objects: {
        Row: {
          artist_id: string | null
          category_id: string | null
          condition_description: string | null
          condition_summary: string | null
          created_at: string
          currency: string
          custom_fields: Json
          description: string | null
          edition: string | null
          edition_number: string | null
          edition_size: number | null
          edition_type: string | null
          frame_condition: string | null
          id: string
          inscription: string | null
          inventory_number: string | null
          is_framed: boolean
          is_insured: boolean
          location_id: string | null
          location_status: string
          medium: string | null
          object_type: string | null
          permanent_location_id: string | null
          provenance: string | null
          signature_info: string | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
          year_created: number | null
        }
        Insert: {
          artist_id?: string | null
          category_id?: string | null
          condition_description?: string | null
          condition_summary?: string | null
          created_at?: string
          currency?: string
          custom_fields?: Json
          description?: string | null
          edition?: string | null
          edition_number?: string | null
          edition_size?: number | null
          edition_type?: string | null
          frame_condition?: string | null
          id?: string
          inscription?: string | null
          inventory_number?: string | null
          is_framed?: boolean
          is_insured?: boolean
          location_id?: string | null
          location_status?: string
          medium?: string | null
          object_type?: string | null
          permanent_location_id?: string | null
          provenance?: string | null
          signature_info?: string | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
          year_created?: number | null
        }
        Update: {
          artist_id?: string | null
          category_id?: string | null
          condition_description?: string | null
          condition_summary?: string | null
          created_at?: string
          currency?: string
          custom_fields?: Json
          description?: string | null
          edition?: string | null
          edition_number?: string | null
          edition_size?: number | null
          edition_type?: string | null
          frame_condition?: string | null
          id?: string
          inscription?: string | null
          inventory_number?: string | null
          is_framed?: boolean
          is_insured?: boolean
          location_id?: string | null
          location_status?: string
          medium?: string | null
          object_type?: string | null
          permanent_location_id?: string | null
          provenance?: string | null
          signature_info?: string | null
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
          year_created?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_permanent_location_id_fkey"
            columns: ["permanent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      provenance_events: {
        Row: {
          citation: string | null
          confidence: string
          created_at: string
          date_text: string | null
          id: string
          notes: string | null
          object_id: string
          owner_contact_id: string | null
          owner_name: string
          place: string | null
          sort_order: number
          transfer_method: string | null
          updated_at: string
          workspace_id: string
          year_from: number | null
          year_to: number | null
        }
        Insert: {
          citation?: string | null
          confidence?: string
          created_at?: string
          date_text?: string | null
          id?: string
          notes?: string | null
          object_id: string
          owner_contact_id?: string | null
          owner_name: string
          place?: string | null
          sort_order?: number
          transfer_method?: string | null
          updated_at?: string
          workspace_id: string
          year_from?: number | null
          year_to?: number | null
        }
        Update: {
          citation?: string | null
          confidence?: string
          created_at?: string
          date_text?: string | null
          id?: string
          notes?: string | null
          object_id?: string
          owner_contact_id?: string | null
          owner_name?: string
          place?: string | null
          sort_order?: number
          transfer_method?: string | null
          updated_at?: string
          workspace_id?: string
          year_from?: number | null
          year_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provenance_events_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provenance_events_owner_contact_id_fkey"
            columns: ["owner_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provenance_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          author: string | null
          created_at: string
          id: string
          notes: string | null
          publisher: string | null
          title: string
          type: string | null
          updated_at: string
          workspace_id: string
          year: number | null
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          publisher?: string | null
          title: string
          type?: string | null
          updated_at?: string
          workspace_id: string
          year?: number | null
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          publisher?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          workspace_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          due_date: string
          entity_id: string | null
          entity_type: string | null
          id: string
          notes: string | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          due_date: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          due_date?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          arrival_date: string | null
          carrier_contact_id: string | null
          consignment_id: string | null
          cost: number | null
          created_at: string
          currency: string
          disposal_id: string | null
          from_location_id: string | null
          from_text: string | null
          id: string
          loan_id: string | null
          packing: Json
          ship_date: string | null
          status: string | null
          to_location_id: string | null
          to_text: string | null
          updated_at: string
          waybill_number: string | null
          workspace_id: string
        }
        Insert: {
          arrival_date?: string | null
          carrier_contact_id?: string | null
          consignment_id?: string | null
          cost?: number | null
          created_at?: string
          currency?: string
          disposal_id?: string | null
          from_location_id?: string | null
          from_text?: string | null
          id?: string
          loan_id?: string | null
          packing?: Json
          ship_date?: string | null
          status?: string | null
          to_location_id?: string | null
          to_text?: string | null
          updated_at?: string
          waybill_number?: string | null
          workspace_id: string
        }
        Update: {
          arrival_date?: string | null
          carrier_contact_id?: string | null
          consignment_id?: string | null
          cost?: number | null
          created_at?: string
          currency?: string
          disposal_id?: string | null
          from_location_id?: string | null
          from_text?: string | null
          id?: string
          loan_id?: string | null
          packing?: Json
          ship_date?: string | null
          status?: string | null
          to_location_id?: string | null
          to_text?: string | null
          updated_at?: string
          waybill_number?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_carrier_contact_id_fkey"
            columns: ["carrier_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_consignment_id_fkey"
            columns: ["consignment_id"]
            isOneToOne: false
            referencedRelation: "consignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_disposal_id_fkey"
            columns: ["disposal_id"]
            isOneToOne: false
            referencedRelation: "disposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      valuations: {
        Row: {
          appraiser_contact_id: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          total_value: number | null
          updated_at: string
          valuation_date: string | null
          valuation_status: string
          valuation_subject: string | null
          value_type: string | null
          workspace_id: string
        }
        Insert: {
          appraiser_contact_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          total_value?: number | null
          updated_at?: string
          valuation_date?: string | null
          valuation_status?: string
          valuation_subject?: string | null
          value_type?: string | null
          workspace_id: string
        }
        Update: {
          appraiser_contact_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          total_value?: number | null
          updated_at?: string
          valuation_date?: string | null
          valuation_status?: string
          valuation_subject?: string | null
          value_type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuations_appraiser_contact_id_fkey"
            columns: ["appraiser_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string
          role: string
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by: string
          role: string
          token?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          accession_prefix: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          accession_prefix?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          accession_prefix?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_workspace_invite: {
        Args: { invite_token: string }
        Returns: string
      }
      can_edit_workspace: { Args: { ws_id: string }; Returns: boolean }
      create_workspace: { Args: { ws_name: string }; Returns: string }
      ensure_personal_workspace: { Args: never; Returns: string }
      is_workspace_member: { Args: { ws_id: string }; Returns: boolean }
      is_workspace_owner: { Args: { ws_id: string }; Returns: boolean }
      workspace_member_emails: {
        Args: { ws_id: string }
        Returns: {
          email: string
          user_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
