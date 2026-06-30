import { ActivityService } from "../activity/ActivityService";
import { AuditService } from "../audit/AuditService";
import { CommandService } from "../commands/CommandService";
import { FavoritesService } from "../favorites/FavoritesService";
import { NavigationService } from "../navigation/NavigationService";
import { NotificationService } from "../notifications/NotificationService";
import { PreferencesService } from "../preferences/PreferencesService";
import { RecentItemsService } from "../recent/RecentItemsService";
import { SearchService } from "../search/SearchService";
import { SessionService } from "../session/SessionService";
import { WidgetsService } from "../widgets/WidgetsService";
import { WorkspaceService } from "../workspace/WorkspaceService";

export class ApplicationService {
  readonly navigation = new NavigationService();
  readonly search = new SearchService();
  readonly commands = new CommandService();
  readonly notifications = new NotificationService();
  readonly activity = new ActivityService();
  readonly favorites = new FavoritesService();
  readonly recentItems = new RecentItemsService();
  readonly widgets = new WidgetsService();
  readonly preferences = new PreferencesService();
  readonly audit = new AuditService();
  readonly workspace = new WorkspaceService();
  readonly session = new SessionService();

  loadApplicationSnapshot(workspaceId: string) {
    return {
      workspace: this.workspace.loadWorkspace(workspaceId),
      notifications: this.notifications.getUnread(),
      recent: this.recentItems.getAll(),
      favorites: this.favorites.getAll(),
      activity: this.activity.getTimeline(10),
      audit: this.audit.getRecent(10)
    };
  }
}

export const applicationService = new ApplicationService();
