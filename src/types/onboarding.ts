export type OnboardingStatus =
    | 'incomplete'
    | 'pending_approval'
    | 'awaiting_docs'
    | 'pending_verification'
    | 'active';

export type ApplicationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type OrganizationApplication = {
    id: string;
    user_id: string;
    organization_type: 'cooperative' | 'institution';
    basic_info: {
        name?: string;
        agrement_number?: string;
        activity_type?: string;
        zone?: string;
    };
    membership_info: {
        adherence_count?: string;
        intervals?: string;
    };
    management_info: {
        manager_name?: string;
        secretary_name?: string;
        president_name?: string;
    };
    status: ApplicationStatus;
    created_at: string;
    updated_at: string;
};

export type DocumentType =
    | 'agrement'
    | 'location_plan'
    | 'id_president'
    | 'id_secretary'
    | 'contract';

export type DocumentStatus = 'pending' | 'verified' | 'rejected';

export type OrganizationDocument = {
    id: string;
    application_id: string;
    document_type: DocumentType;
    file_url: string;
    status: DocumentStatus;
    comments?: string;
    created_at: string;
};
