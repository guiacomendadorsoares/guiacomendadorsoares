# Project architecture
- Property publication is enforced by a dedicated database trigger and administrator-only approval actions; browser defaults cannot authorize publication.
- The Home property feed reads only active, approved properties without consulting private owner profiles or subscription entitlements, so public visibility is independent of advertiser plans.