import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SYSTEM_FOLDERS } from '../folders/folder.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const domain = this.config.get<string>('MAIL_DOMAIN', 'example.com');
    const local = dto.username.trim().toLowerCase();
    if (!/^[a-z0-9._-]+$/.test(local)) {
      throw new ConflictException(
        'Use apenas letras, números, ponto, hífen ou sublinhado no usuário.',
      );
    }
    const email = `${local}@${domain}`;
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Este usuário já existe.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: dto.displayName?.trim() || local,
        folders: {
          create: SYSTEM_FOLDERS.map((f) => ({ kind: f.kind, name: f.name })),
        },
      },
    });

    return this.tokenResponse(user.id, user.email, user.displayName);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }
    return this.tokenResponse(user.id, user.email, user.displayName);
  }

  private tokenResponse(userId: string, email: string, displayName: string) {
    const accessToken = this.jwt.sign({ sub: userId, email });
    return {
      accessToken,
      user: { id: userId, email, displayName },
    };
  }
}
