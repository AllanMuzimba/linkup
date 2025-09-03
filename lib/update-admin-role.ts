import { AdminService } from './admin-services'

// Function to update the specified user to admin role
export async function updateUserToAdmin() {
  try {
    const result = await AdminService.updateUserRoleByEmail('mrallanrass@gmail.com', 'super_admin')
    if (result) {
      console.log('Successfully updated user mrallanrass@gmail.com to super_admin role')
    } else {
      console.log('User with email mrallanrass@gmail.com not found')
    }
    return result
  } catch (error) {
    console.error('Error updating user role:', error)
    return false
  }
}

// Auto-run this function when the module is imported
updateUserToAdmin()