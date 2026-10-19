import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthRequest } from './auth';
import { intId } from './persistence';
import { PrismaService } from './prisma.service';

export const GIE_ACCOUNT_EMAIL = 'admin.dev@emps.local';

@Injectable()
export class GieAccessGuard implements CanActivate {
  constructor(private readonly db: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const { user } = context.switchToHttp().getRequest<AuthRequest>();
    if (!user?.sub) throw new ForbiddenException('Acesso ao GIE não autorizado');
    // Re-read identity: an old JWT email or a frontend condition cannot grant access.
    const account = await this.db.user.findUnique({
      where: { id: intId(user.sub) }, select: { email: true, accountStatus: true },
    });
    if (account?.accountStatus !== 'ACTIVE' || account.email.toLowerCase() !== GIE_ACCOUNT_EMAIL) {
      throw new ForbiddenException('Acesso ao GIE não autorizado');
    }
    return true;
  }
}
